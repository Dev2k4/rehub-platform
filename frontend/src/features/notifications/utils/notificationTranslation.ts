export const TRANSLATE_TITLE: Record<string, string> = {
  "New offer received": "Có đề xuất giá mới",
  "Offer accepted": "Đề xuất giá đã được chấp nhận",
  "Escrow pending funding": "Chờ nạp tiền vào Escrow",
  "Offer status updated": "Trạng thái đề xuất đã cập nhật",
  "New review received": "Đánh giá mới nhận được",
  "New order created": "Đơn hàng mới được tạo",
  "Order completed": "Đơn hàng đã hoàn tất",
  "Order cancelled": "Đơn hàng đã hủy",
  "Escrow funded": "Đã thanh toán qua Escrow",
  "Delivery marked": "Đã chuyển hàng",
  "Order status updated": "Trạng thái đơn hàng đã cập nhật",
  "Escrow released": "Escrow đã giải ngân",
  "Escrow disputed": "Tranh chấp Escrow",
  "Escrow resolved": "Đã giải quyết tranh chấp",
  "Listing approved": "Tin đăng đã được duyệt",
  "Listing rejected": "Tin đăng bị từ chối",
  "Welcome to ReHub": "Chào mừng đến với ReHub",
};

export const translateNotification = (
  title: string,
  message: string,
): { title: string; message: string } => {
  let translatedTitle = title;
  let translatedMessage = message;

  if (TRANSLATE_TITLE[title]) {
    translatedTitle = TRANSLATE_TITLE[title];
  }

  const messageMap: Record<string, string> = {
    "Order created with escrow. Please fund your demo wallet escrow to continue.":
      "Đã tạo đơn hàng qua Escrow. Vui lòng nạp tiền vào ví Escrow để hoàn tất đặt hàng.",
    "Seller marked this order as delivered. Please confirm receipt.":
      "Người bán đã thông báo chuyển hàng. Vui lòng kiểm tra và xác nhận nhận hàng.",
    "Buyer funded escrow. You can proceed to delivery.":
      "Người mua đã nạp tiền Escrow. Bạn có thể tiến hành giao hàng ngay.",
    "Buyer confirmed delivery. Funds were released to your demo wallet.":
      "Người mua xác nhận đã nhận hàng. Tiền thanh toán đã được cộng vào ví của bạn.",
    "A dispute has been opened for this order.":
      "Đã mở yêu cầu khiếu nại/tranh chấp cho đơn hàng này.",
    "Buyer marked the order as completed.":
      "Người mua đã đánh dấu hoàn thành cho đơn hàng.",
    "Seller updated order status: preparing package.":
      "Người bán đã cập nhật trạng thái: đang chuẩn bị hàng.",
    "Seller updated order status: shipping in progress.":
      "Người bán đã cập nhật trạng thái: đang giao hàng.",
    "The order was cancelled by the counterparty.":
      "Đơn hàng này đã bị hủy bởi đối tác.",
    "You received a new review from a completed order.":
      "Bạn nhận được 1 đánh giá mới từ đơn hàng đã hoàn tất.",
  };

  if (messageMap[message]) {
    translatedMessage = messageMap[message];
  } else {
    // Basic dynamic matching for messages with variables
    translatedMessage = translatedMessage.replace(
      /You received an offer of (.*?) for your listing/i,
      "Bạn nhận được đề xuất giá $1 cho tin đăng",
    );
    translatedMessage = translatedMessage.replace(
      /Your offer for listing (.*?) was accepted/i,
      "Đề xuất giá cho tin đăng $1 đã được chấp nhận",
    );
  }

  return { title: translatedTitle, message: translatedMessage };
};
