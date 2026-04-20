import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import {
  FiActivity,
  FiCheckCircle,
  FiGrid,
  FiShoppingBag,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { useAdminCategories } from "../hooks/useAdminCategories";
import { usePendingListings } from "../hooks/useAdminListings";
import { useAdminOrders } from "../hooks/useAdminOrders";
import { useAdminUsers } from "../hooks/useAdminUsers";

// Simple CSS donut chart
function DonutChart({
  percent,
  color,
  size = 80,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (percent / 100) * circumference;
  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} flexShrink={0}>
      <svg width={size} height={size} style={{ display: "block" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#CBD5E0"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: "bold",
          color: color,
        }}
      >
        {percent}%
      </div>
    </Box>
  );
}

interface QuickActionCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  value: number | string;
  valueColor: string;
  bgGradient: string;
  to: string;
  loading?: boolean;
}

function QuickActionCard({
  icon: Icon,
  title,
  subtitle,
  value,
  valueColor,
  bgGradient,
  to,
  loading,
}: QuickActionCardProps) {
  const navigate = useNavigate();
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.300"
      borderRadius="1.25rem"
      boxShadow="0 2px 12px rgba(0,0,0,0.04)"
      p={6}
      cursor="pointer"
      transition="all 0.25s ease"
      _hover={{
        transform: "translateY(-3px)",
        boxShadow: "0 8px 28px rgba(0,0,0,0.08)",
        borderColor: "blue.200",
      }}
      onClick={() => navigate({ to })}
    >
      <Flex align="center" justify="space-between" mb={4}>
        <Flex
          w={12}
          h={12}
          align="center"
          justify="center"
          borderRadius="xl"
          style={{ background: bgGradient }}
        >
          <Box as={Icon} w={6} h={6} color="white" />
        </Flex>
        {loading ? (
          <Spinner size="sm" color="gray.400" />
        ) : (
          <Heading as="h3" fontSize="2xl" fontWeight="800" color={valueColor}>
            {value}
          </Heading>
        )}
      </Flex>
      <Text fontWeight="700" fontSize="sm" color="gray.800" mb={0.5}>
        {title}
      </Text>
      <Text fontSize="xs" color="gray.500">
        {subtitle}
      </Text>
    </Box>
  );
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers({
    limit: 200,
  });
  const { data: pendingListings = [], isLoading: listingsLoading } =
    usePendingListings({ limit: 200 });
  const { data: categories = [], isLoading: categoriesLoading } =
    useAdminCategories();
  const { data: orders = [], isLoading: ordersLoading } = useAdminOrders({
    limit: 200,
  });

  const isLoading =
    usersLoading || listingsLoading || categoriesLoading || ordersLoading;

  const totalUsers = users.length;
  const activeUsers = users.filter((u: any) => !u.is_banned).length;
  const bannedUsers = totalUsers - activeUsers;
  const pendingCount = pendingListings.length;
  const completedOrders = orders.filter(
    (o: any) => o.status === "completed",
  ).length;
  const pendingOrders = orders.filter(
    (o: any) => o.status === "pending",
  ).length;
  const activeUserRate =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const approvalRate =
    totalUsers > 0 ? Math.round((pendingCount / (totalUsers || 1)) * 100) : 0;

  const now = new Date().toLocaleString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Container maxW="7xl" px={0}>
      {/* Page Header */}
      <Flex align="center" justify="space-between" mb={8} wrap="wrap" gap={4}>
        <Box>
          <Heading as="h1" fontSize="1.75rem" fontWeight="800" color="gray.900">
            Tổng quan hệ thống
          </Heading>
          <Text color="gray.500" fontSize="sm" mt={0.5}>
            {now}
          </Text>
        </Box>
      </Flex>

      {/* Stat Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={5} mb={8}>
        <QuickActionCard
          icon={FiUsers}
          title="Tổng người dùng"
          subtitle={`${activeUsers} đang hoạt động · ${bannedUsers} bị cấm`}
          value={totalUsers}
          valueColor="blue.600"
          bgGradient="linear-gradient(135deg, #3B82F6, #60A5FA)"
          to="/admin/users"
          loading={usersLoading}
        />
        <QuickActionCard
          icon={FiCheckCircle}
          title="Tin chờ duyệt"
          subtitle="Cần phê duyệt ngay"
          value={pendingCount}
          valueColor="orange.500"
          bgGradient="linear-gradient(135deg, #F97316, #FB923C)"
          to="/admin/listings"
          loading={listingsLoading}
        />
        <QuickActionCard
          icon={FiShoppingBag}
          title="Đơn hàng"
          subtitle={`${completedOrders} hoàn thành · ${pendingOrders} chờ`}
          value={orders.length}
          valueColor="green.600"
          bgGradient="linear-gradient(135deg, #10B981, #34D399)"
          to="/admin/orders"
          loading={ordersLoading}
        />
        <QuickActionCard
          icon={FiGrid}
          title="Danh mục"
          subtitle="Quản lý cây danh mục"
          value={categories.length}
          valueColor="purple.600"
          bgGradient="linear-gradient(135deg, #7C3AED, #A78BFA)"
          to="/admin/categories"
          loading={categoriesLoading}
        />
      </SimpleGrid>

      {/* Two column: Charts + Actions */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6} mb={6}>
        {/* User Health Card */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.300"
          borderRadius="1.25rem"
          boxShadow="0 2px 12px rgba(0,0,0,0.04)"
          p={6}
        >
          <HStack mb={5} gap={2}>
            <Box as={FiActivity} color="blue.500" w={5} h={5} />
            <Heading as="h2" fontSize="md" fontWeight="700" color="gray.800">
              Tỷ lệ hoạt động
            </Heading>
          </HStack>
          {isLoading ? (
            <Flex justify="center" py={6}>
              <Spinner color="blue.500" />
            </Flex>
          ) : (
            <VStack gap={5} align="stretch">
              {/* Active users */}
              <Flex align="center" gap={4}>
                <DonutChart
                  percent={activeUserRate}
                  color="#3B82F6"
                  size={72}
                />
                <Box>
                  <Text fontWeight="700" fontSize="sm" color="gray.800">
                    Tỷ lệ người dùng hoạt động
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {activeUsers}/{totalUsers} tài khoản đang hoạt động
                  </Text>
                  <Box mt={2} h="6px" borderRadius="full" bg="gray.100">
                    <Box
                      h="6px"
                      borderRadius="full"
                      bg="blue.400"
                      w={`${activeUserRate}%`}
                    />
                  </Box>
                </Box>
              </Flex>
              {/* Pending rate */}
              <Flex align="center" gap={4}>
                <DonutChart
                  percent={Math.min(approvalRate, 100)}
                  color="#F97316"
                  size={72}
                />
                <Box>
                  <Text fontWeight="700" fontSize="sm" color="gray.800">
                    Áp lực phê duyệt
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {pendingCount} tin đang chờ so với {totalUsers} người dùng
                  </Text>
                  <Box mt={2} h="6px" borderRadius="full" bg="gray.100">
                    <Box
                      h="6px"
                      borderRadius="full"
                      bg="orange.400"
                      w={`${Math.min(approvalRate, 100)}%`}
                    />
                  </Box>
                </Box>
              </Flex>
            </VStack>
          )}
        </Box>

        {/* Order stats */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.300"
          borderRadius="1.25rem"
          boxShadow="0 2px 12px rgba(0,0,0,0.04)"
          p={6}
        >
          <HStack mb={5} gap={2}>
            <Box as={FiTrendingUp} color="green.500" w={5} h={5} />
            <Heading as="h2" fontSize="md" fontWeight="700" color="gray.800">
              Thống kê đơn hàng
            </Heading>
          </HStack>
          {ordersLoading ? (
            <Flex justify="center" py={6}>
              <Spinner color="green.500" />
            </Flex>
          ) : (
            <VStack gap={4} align="stretch">
              {[
                {
                  label: "Hoàn thành",
                  count: completedOrders,
                  color: "green",
                  hex: "#10B981",
                },
                {
                  label: "Chờ xử lý",
                  count: pendingOrders,
                  color: "yellow",
                  hex: "#F59E0B",
                },
                {
                  label: "Đã hủy",
                  count: orders.filter((o: any) => o.status === "cancelled")
                    .length,
                  color: "red",
                  hex: "#EF4444",
                },
              ].map((s) => {
                const pct =
                  orders.length > 0
                    ? Math.round((s.count / orders.length) * 100)
                    : 0;
                return (
                  <Box key={s.label}>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="sm" fontWeight="600" color="gray.700">
                        {s.label}
                      </Text>
                      <HStack gap={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="700"
                          color={`${s.color}.600`}
                        >
                          {s.count}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          ({pct}%)
                        </Text>
                      </HStack>
                    </Flex>
                    <Box h="8px" borderRadius="full" bg="gray.100">
                      <Box
                        h="8px"
                        borderRadius="full"
                        bg={s.hex}
                        w={`${pct}%`}
                        transition="width 0.6s ease"
                      />
                    </Box>
                  </Box>
                );
              })}
              <Box mt={2} pt={3} borderTop="1px solid" borderColor="gray.300">
                <Text fontSize="xs" color="gray.500">
                  Tổng cộng: <b>{orders.length}</b> đơn hàng trên hệ thống
                </Text>
              </Box>
            </VStack>
          )}
        </Box>
      </Grid>

      {/* Quick Links */}
     
    </Container>
  );
}
