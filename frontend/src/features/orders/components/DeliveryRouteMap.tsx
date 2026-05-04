import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { FiTruck } from "react-icons/fi"
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
      <Flex h="300px" align="center" justify="center" bg="gray.50" flexDir="column" gap={3}>
        <Spinner color="blue.500" />
        <Text color="gray.500" fontSize="sm">Đang tải dữ liệu bản đồ...</Text>
      </Flex>
    )
  }

  if (isError || !routeInfo) {
    return (
      <Flex h="300px" align="center" justify="center" bg="gray.50" p={6} textAlign="center">
        <Text color="red.500" fontSize="sm">
          Không thể tính toán đường đi. Vui lòng kiểm tra lại địa chỉ hoặc thử lại sau.
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
          map.fitBounds(routeData.path, { padding: [30, 30] })
        } else {
          map.fitBounds([sellerCoords, buyerCoords], { padding: [50, 50] })
        }
      }, [map])
    } catch (e) {
      // Ignore if useMap fails
    }
    return null
  }

  return (
    <Box position="relative">
      {/* Route Info Overlay */}
      {routeData && (
        <Box 
          position="absolute" 
          top={3} 
          right={3} 
          zIndex={1000} 
          bg="white" 
          p={3} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px"
          borderColor="gray.200"
        >
          <Flex align="center" gap={3}>
            <Box bg="blue.50" p={2} borderRadius="full" color="blue.500">
              <FiTruck size={16} />
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.500" fontWeight="medium">Khoảng cách ước tính</Text>
              <Text fontSize="md" fontWeight="bold" color="gray.800">
                {routeData.distanceKm === 0 ? "< 1 km" : `${routeData.distanceKm.toFixed(1)} km`}
              </Text>
            </Box>
          </Flex>
          {routeData.durationMinutes > 0 && (
            <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
              ~{Math.round(routeData.durationMinutes / 60)}h {routeData.durationMinutes % 60}p di chuyển
            </Text>
          )}
        </Box>
      )}

      {/* Map */}
      <Box h="350px" w="full" bg="gray.100">
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
              weight={4} 
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
          <Marker position={buyerCoords} icon={buyerIcon}>
            <Popup>
              <strong>Người mua</strong><br/>
              {buyerDistrict ? `${buyerDistrict}, ` : ""}{buyerProvince}
            </Popup>
          </Marker>
        </MapContainer>
      </Box>

      {/* Legend below map */}
      <Flex p={2} bg="gray.50" justify="center" gap={6} fontSize="xs" color="gray.600" borderTop="1px" borderColor="gray.200">
        <Flex align="center" gap={1}>
          <Box w={3} h={3} borderRadius="full" bg="#2A81CB" />
          <Text>Điểm lấy hàng (Người bán)</Text>
        </Flex>
        <Flex align="center" gap={1}>
          <Box w={3} h={3} borderRadius="full" bg="#2AAD27" />
          <Text>Điểm giao hàng (Người mua)</Text>
        </Flex>
      </Flex>
    </Box>
  )
}
