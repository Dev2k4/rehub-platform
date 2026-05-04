import { Box, Flex, Spinner, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { FiMapPin, FiExternalLink } from "react-icons/fi"
import { MapContainer, Marker, TileLayer } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default icon issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const customIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type ListingLocationMapProps = {
  province?: string
  district?: string
}

// Geocode using Nominatim
const geocodeAddress = async (query: string): Promise<[number, number] | null> => {
  try {
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

export function ListingLocationMap({ province, district }: ListingLocationMapProps) {
  // Build full address string
  const addressParts = [district, province, "Vietnam"].filter(Boolean)
  const fullAddress = addressParts.join(", ")
  const displayAddress = [district, province].filter(Boolean).join(", ")

  const { data: coords, isLoading } = useQuery({
    queryKey: ["geocode", fullAddress],
    queryFn: () => geocodeAddress(fullAddress),
    enabled: !!province,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })

  if (!province) {
    return null
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`

  return (
    <Box
      bg="whiteAlpha.800"
      backdropFilter="blur(20px)"
      borderRadius="xl"
      boxShadow="0 10px 40px rgba(0,0,0,0.06)"
      border="1px"
      borderColor="whiteAlpha.400"
      p={6}
    >
      <Flex align="center" gap={2} mb={4}>
        <FiMapPin size={20} color="#e53e3e" />
        <Text fontSize="md" fontWeight="bold" color="gray.900">
          Khu vực giao dịch
        </Text>
      </Flex>

      <Text fontSize="sm" color="gray.700" mb={4} lineHeight={1.6}>
        {displayAddress}
      </Text>

      <Box 
        position="relative" 
        w="full" 
        h="200px" 
        borderRadius="lg" 
        overflow="hidden"
        border="1px solid"
        borderColor="gray.200"
        cursor="pointer"
        onClick={() => window.open(googleMapsUrl, "_blank")}
        role="button"
        tabIndex={0}
        _hover={{ "& .map-overlay": { opacity: 1 } }}
      >
        {isLoading ? (
          <Flex h="full" w="full" bg="gray.50" align="center" justify="center">
            <Spinner color="blue.500" />
          </Flex>
        ) : coords ? (
          <>
            <Box h="full" w="full" pointerEvents="none">
              <MapContainer 
                center={coords} 
                zoom={14} 
                zoomControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                dragging={false}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coords} icon={customIcon} />
              </MapContainer>
            </Box>
            
            {/* Hover overlay that shows "Mở trong Google Maps" */}
            <Flex 
              className="map-overlay"
              position="absolute"
              top={0} left={0} right={0} bottom={0}
              bg="blackAlpha.400"
              zIndex={2}
              opacity={0}
              transition="opacity 0.2s"
              align="center"
              justify="center"
            >
              <Flex 
                bg="white" 
                px={4} py={2} 
                borderRadius="full" 
                align="center" 
                gap={2}
                boxShadow="md"
                color="gray.800"
                fontWeight="semibold"
                fontSize="sm"
              >
                <FiExternalLink />
                Xem trên Google Maps
              </Flex>
            </Flex>
          </>
        ) : (
          <Flex h="full" w="full" bg="gray.50" align="center" justify="center" p={4} textAlign="center">
            <Text color="gray.500" fontSize="sm">
              Không thể tải bản đồ cho địa chỉ này.
            </Text>
          </Flex>
        )}
      </Box>
    </Box>
  )
}
