import { Box, Flex, HStack, Spinner, Text, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { FiMapPin, FiNavigation, FiExternalLink } from "react-icons/fi"
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
  ward?: string
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

/**
 * Opens Google Maps directions from the user's current location to the seller's address.
 * Uses the browser Geolocation API to get the buyer's current position,
 * then opens Google Maps with driving directions.
 */
const openDirections = (destinationAddress: string, coords: [number, number] | null) => {
  // Destination: use coordinates if available for precision, otherwise address string
  const destination = coords
    ? `${coords[0]},${coords[1]}`
    : encodeURIComponent(destinationAddress)

  // Use Google Maps directions URL – origin is left blank so Google uses the user's current location
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
  window.open(directionsUrl, "_blank")
}

export function ListingLocationMap({ province, district, ward }: ListingLocationMapProps) {
  // Build full address string
  const addressParts = [ward, district, province, "Vietnam"].filter(Boolean)
  const fullAddress = addressParts.join(", ")
  const displayAddress = [ward, district, province].filter(Boolean).join(", ")

  const { data: coords, isLoading } = useQuery({
    queryKey: ["geocode", fullAddress],
    queryFn: () => geocodeAddress(fullAddress),
    enabled: !!province,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })

  if (!province) {
    return null
  }

  return (
    <Box
      bg="whiteAlpha.800"
      backdropFilter="blur(20px)"
      borderRadius="xl"
      boxShadow="0 10px 40px rgba(0,0,0,0.06)"
      border="1px"
      borderColor="whiteAlpha.400"
      overflow="hidden"
    >
      {/* Header */}
      <Box p={5} pb={3}>
        <Flex align="center" gap={2} mb={2}>
          <Box
            w={8}
            h={8}
            borderRadius="lg"
            bg="red.50"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <FiMapPin size={16} color="#e53e3e" />
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="sm" fontWeight="bold" color="gray.900">
              Khu vực người bán
            </Text>
            <Text fontSize="xs" color="gray.500" lineHeight={1.3}>
              {displayAddress}
            </Text>
          </VStack>
        </Flex>
      </Box>

      {/* Map Area */}
      <Box 
        position="relative" 
        w="full" 
        h="220px" 
        cursor="pointer"
        onClick={() => openDirections(fullAddress, coords ?? null)}
        role="button"
        tabIndex={0}
        _hover={{ "& .map-overlay": { opacity: 1 } }}
      >
        {isLoading ? (
          <Flex h="full" w="full" bg="gray.50" align="center" justify="center">
            <VStack gap={2}>
              <Spinner color="blue.500" />
              <Text fontSize="xs" color="gray.400">Đang tải bản đồ...</Text>
            </VStack>
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
            
            {/* Hover overlay */}
            <Flex 
              className="map-overlay"
              position="absolute"
              top={0} left={0} right={0} bottom={0}
              bg="blackAlpha.500"
              zIndex={2}
              opacity={0}
              transition="opacity 0.25s ease"
              align="center"
              justify="center"
              direction="column"
              gap={2}
            >
              <Flex 
                bg="white" 
                px={5} py={2.5} 
                borderRadius="full" 
                align="center" 
                gap={2}
                boxShadow="0 8px 24px rgba(0,0,0,0.2)"
                color="blue.600"
                fontWeight="bold"
                fontSize="sm"
              >
                <FiNavigation />
                Tìm đường đến người bán
              </Flex>
              <Text fontSize="xs" color="whiteAlpha.800" fontWeight="500">
                Mở trong Google Maps
              </Text>
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

      {/* Footer action bar */}
      <a 
        href={`https://www.google.com/maps/dir/?api=1&destination=${coords ? `${coords[0]},${coords[1]}` : encodeURIComponent(fullAddress)}&travelmode=driving`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        <HStack
          px={5}
          py={3}
          bg="gray.50"
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
    </Box>
  )
}
