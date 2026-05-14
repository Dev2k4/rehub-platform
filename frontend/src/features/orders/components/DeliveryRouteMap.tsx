import { Box, Flex, HStack, Spinner, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { FiTruck, FiNavigation, FiExternalLink } from "react-icons/fi"
import { MapContainer, Marker, Polyline, TileLayer, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default icon issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom colored markers
const createColoredIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

const sellerIcon = createColoredIcon("blue")
const buyerIcon = createColoredIcon("green")

type DeliveryRouteMapProps = {
  sellerProvince: string
  sellerDistrict?: string
  buyerProvince: string
  buyerDistrict?: string
  compact?: boolean
}

type LatLng = [number, number]

interface RouteData {
  distanceKm: number
  durationMinutes: number
  path: LatLng[]
}

// Helper to geocode an address using free Nominatim API
const geocodeAddress = async (province: string, district?: string): Promise<LatLng | null> => {
  try {
    const query = `${district ? district + ", " : ""}${province}, Vietnam`
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    
    const res = await fetch(url)
    const data = await res.json()
    
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    }
    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

// Helper to get route using free OSRM API
const getRoute = async (start: LatLng, end: LatLng): Promise<RouteData | null> => {
  try {
    // OSRM format: lon,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      // GeoJSON returns [lon, lat], Leaflet needs [lat, lon]
      const path: LatLng[] = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])
      
      return {
        distanceKm: route.distance / 1000,
        durationMinutes: Math.ceil(route.duration / 60),
        path,
      }
    }
    return null
  } catch (error) {
    console.error("Routing error:", error)
    return null
  }
}

export function DeliveryRouteMap({
  sellerProvince,
  sellerDistrict,
  buyerProvince,
  buyerDistrict,
  compact = false,
}: DeliveryRouteMapProps) {
  // Use React Query to cache the geocoding and routing results to avoid hitting API rate limits
  const { data: routeInfo, isLoading, isError } = useQuery({
    queryKey: ["delivery-route", sellerProvince, sellerDistrict, buyerProvince, buyerDistrict],
    queryFn: async () => {
      // 1. Geocode both locations
      const sellerCoords = await geocodeAddress(sellerProvince, sellerDistrict)
      const buyerCoords = await geocodeAddress(buyerProvince, buyerDistrict)
      
      if (!sellerCoords || !buyerCoords) {
        throw new Error("Could not geocode one or both addresses")
      }
      
      // If locations are identical (same district and province), return a mock 0km route
      if (sellerCoords[0] === buyerCoords[0] && sellerCoords[1] === buyerCoords[1]) {
        // Slightly offset the buyer coords just to show two markers
        const offsetBuyer: LatLng = [buyerCoords[0] + 0.005, buyerCoords[1] + 0.005]
        return {
          sellerCoords,
          buyerCoords: offsetBuyer,
          routeData: {
            distanceKm: 0,
            durationMinutes: 0,
            path: [sellerCoords, offsetBuyer]
          }
        }
      }
      
      // 2. Get route
      const routeData = await getRoute(sellerCoords, buyerCoords)
      
      return {
        sellerCoords,
        buyerCoords,
        routeData,
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  })

  if (isLoading) {
    return (
      <Flex h={compact ? "100%" : "300px"} align="center" justify="center" bg="gray.50" flexDir="column" gap={2}>
        <Spinner color="blue.500" size={compact ? "sm" : "md"} />
        <Text color="gray.500" fontSize={compact ? "xs" : "sm"}>Đang tải dữ liệu bản đồ...</Text>
      </Flex>
    )
  }

  if (isError || !routeInfo) {
    return (
      <Flex h={compact ? "100%" : "300px"} align="center" justify="center" bg="gray.50" p={compact ? 2 : 6} textAlign="center">
        <Text color="red.500" fontSize={compact ? "xs" : "sm"}>
          {compact ? "Không thể tải bản đồ" : "Không thể tính toán đường đi. Vui lòng kiểm tra lại địa chỉ hoặc thử lại sau."}
        </Text>
      </Flex>
    )
  }

  const { sellerCoords, buyerCoords, routeData } = routeInfo

  // Calculate center between the two points for initial map view
  const center: LatLng = [
    (sellerCoords[0] + buyerCoords[0]) / 2,
    (sellerCoords[1] + buyerCoords[1]) / 2,
  ]

  // A component to automatically fit the map bounds to our route
  const MapFitBounds = () => {
    try {
      // @ts-ignore - this hook exists in react-leaflet but TS might complain
      const { useMap } = require("react-leaflet")
      const map = useMap()
      
      useEffect(() => {
        if (routeData?.path && routeData.path.length > 0) {
          map.fitBounds(routeData.path, { padding: compact ? [15, 15] : [30, 30] })
        } else {
          map.fitBounds([sellerCoords, buyerCoords], { padding: compact ? [20, 20] : [50, 50] })
        }
      }, [map])
    } catch (e) {
      // Ignore if useMap fails
    }
    return null;
  };

  const isSameLocation =
    sellerProvince === buyerProvince && sellerDistrict === buyerDistrict;

  const destStr = isSameLocation
    ? `${sellerCoords[0]},${sellerCoords[1]}`
    : `${buyerCoords[0]},${buyerCoords[1]}`;

  const originStr = isSameLocation ? "" : `${sellerCoords[0]},${sellerCoords[1]}`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&${
    originStr ? `origin=${originStr}&` : ""
  }destination=${destStr}&travelmode=driving`;

  const openGoogleMapsDirections = () => {
    window.open(directionsUrl, "_blank");
  };

  return (
    <Box position="relative" h={compact ? "100%" : "auto"} w="full" overflow="hidden">
      {/* Route Info Overlay */}
      {routeData && (
        <Box 
          position="absolute" 
          top={compact ? 2 : 3} 
          right={compact ? 2 : 3} 
          zIndex={1000} 
          bg="whiteAlpha.900" 
          backdropFilter="blur(8px)"
          p={compact ? 1.5 : 3} 
          px={compact ? 2.5 : 3}
          borderRadius="md" 
          boxShadow="sm"
          border="1px"
          borderColor="gray.200"
        >
          <Flex align="center" gap={compact ? 2 : 3}>
            {!compact && (
              <Box bg="blue.50" p={2} borderRadius="full" color="blue.500">
                <FiTruck size={16} />
              </Box>
            )}
            <Box>
              <Text fontSize={compact ? "9px" : "xs"} color="gray.500" fontWeight="medium" textTransform={compact ? "uppercase" : "none"} letterSpacing={compact ? "wider" : "normal"}>
                {compact ? "Khoảng cách" : "Khoảng cách ước tính"}
              </Text>
              <Text fontSize={compact ? "xs" : "md"} fontWeight="bold" color="gray.800" lineHeight={compact ? "1.2" : "normal"}>
                {routeData.distanceKm === 0 ? "< 1 km" : `${routeData.distanceKm.toFixed(1)} km`}
              </Text>
            </Box>
          </Flex>
          {!compact && routeData.durationMinutes > 0 && (
            <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
              ~{Math.round(routeData.durationMinutes / 60)}h {routeData.durationMinutes % 60}p di chuyển
            </Text>
          )}
        </Box>
      )}

      {/* Map */}
      <Box 
        position="relative"
        h={compact ? "100%" : "350px"} 
        w="full" 
        bg="gray.100"
        cursor="pointer"
        onClick={openGoogleMapsDirections}
        role="button"
        tabIndex={0}
        _hover={{ "& .map-overlay": { opacity: 1 } }}
      >
        <Box h="full" w="full" pointerEvents={compact ? "none" : "auto"}>
          <MapContainer 
            center={center} 
            zoom={6} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%", zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapFitBounds />
            
            {/* Route Line */}
            {routeData && routeData.path.length > 0 && (
              <Polyline 
                positions={routeData.path} 
                color="#3B82F6" 
                weight={compact ? 3 : 4} 
                opacity={0.7} 
                dashArray={routeData.distanceKm === 0 ? "5, 10" : undefined}
              />
            )}
            
            {/* Seller Marker */}
            <Marker position={sellerCoords} icon={sellerIcon}>
              <Popup>
                <strong>Người bán</strong><br/>
                {sellerDistrict ? `${sellerDistrict}, ` : ""}{sellerProvince}
              </Popup>
            </Marker>
            
            {/* Buyer Marker */}
            {!compact && (
              <Marker position={buyerCoords} icon={buyerIcon}>
                <Popup>
                  <strong>Người mua</strong><br/>
                  {buyerDistrict ? `${buyerDistrict}, ` : ""}{buyerProvince}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </Box>

        {/* Hover overlay */}
        <Flex 
          className="map-overlay"
          position="absolute"
          top={0} left={0} right={0} bottom={0}
          bg="blackAlpha.500"
          zIndex={1000}
          opacity={0}
          transition="opacity 0.25s ease"
          align="center"
          justify="center"
          direction="column"
          gap={2}
          pointerEvents="none"
        >
          <Flex 
            bg="white" 
            px={4} py={2} 
            borderRadius="full" 
            align="center" 
            gap={2}
            boxShadow="0 8px 24px rgba(0,0,0,0.2)"
            color="blue.600"
            fontWeight="bold"
            fontSize={compact ? "xs" : "sm"}
          >
            <FiNavigation />
            {isSameLocation ? "Tìm đường đến người bán" : "Xem lộ trình trên Google Maps"}
          </Flex>
          {!compact && (
            <Text fontSize="xs" color="whiteAlpha.800" fontWeight="500">
              Mở trong Google Maps
            </Text>
          )}
        </Flex>
      </Box>

      {/* Legend below map */}
      {!compact && (
        <Flex p={2} bg="gray.50" justify="center" gap={6} fontSize="xs" color="gray.600" borderTop="1px" borderColor="gray.200">
          <Flex align="center" gap={1}>
            <Box w={3} h={3} borderRadius="full" bg="#2A81CB" />
            <Text>Điểm lấy hàng</Text>
          </Flex>
          <Flex align="center" gap={1}>
            <Box w={3} h={3} borderRadius="full" bg="#2AAD27" />
            <Text>Điểm giao hàng</Text>
          </Flex>
        </Flex>
      )}

      {/* Footer action bar */}
      {!compact && (
        <a 
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <HStack
            px={5}
            py={3}
            bg="white"
            borderTop="1px solid"
            borderColor="gray.100"
            justify="space-between"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: "blue.50" }}
          >
            <HStack gap={2}>
              <FiNavigation size={14} color="#2563eb" />
              <Text fontSize="xs" fontWeight="600" color="blue.600">
                Xem đường đi trên Google Maps
              </Text>
            </HStack>
            <FiExternalLink size={14} color="#2563eb" />
          </HStack>
        </a>
      )}
    </Box>
  )
}
