export const TRANSLATE_TITLE: Record<string, string> = {
  "New offer received": "Có đề xuất giá mới",
  "Offer accepted": "Đề xuất giá đã được chấp nhận",
  "Escrow pending funding": "Chờ nạp tiền vào Ví Rehub",
  "Offer status updated": "Trạng thái đề xuất đã cập nhật",
  "New review received": "Đánh giá mới nhận được",
  "New order created": "Đơn hàng mới được tạo",
  "Order completed": "Đơn hàng đã hoàn tất",
  "Order cancelled": "Đơn hàng đã hủy",
  "Escrow funded": "Đã thanh toán qua Ví Rehub",
  "Delivery marked": "Đã chuyển hàng",
  "Order status updated": "Trạng thái đơn hàng đã cập nhật",
  "Escrow released": "Ví Rehub đã giải ngân",
  "Escrow disputed": "Tranh chấp Ví Rehub",
  "Escrow resolved": "Đã giải quyết tranh chấp",
  "Listing approved": "Tin đăng đã được duyệt",
  "Listing rejected": "Tin đăng bị từ chối",
  "Welcome to ReHub": "Chào mừng đến with ReHub",
  "Order created successfully": "Tạo đơn hàng thành công",
  "New order received": "Có đơn hàng mới",
  "Đã thanh toán qua Ví Rehub": "Đã thanh toán qua Ví Rehub",
  "Ví Rehub đã giải ngân": "Ví Rehub đã giải ngân",
  "Tranh chấp Ví Rehub": "Tranh chấp Ví Rehub",
  "Đã giải quyết giao dịch Ví Rehub": "Đã giải quyết giao dịch Ví Rehub",
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
      "Đã tạo đơn hàng. Vui lòng nạp tiền vào Ví Rehub để hoàn tất đặt hàng.",
    "Seller marked this order as delivered. Please confirm receipt.":
      "Người bán đã thông báo chuyển hàng. Vui lòng kiểm tra và xác nhận nhận hàng qua Ví Rehub.",
    "Buyer funded escrow. You can proceed to delivery.":
      "Người mua đã nạp tiền vào Ví Rehub. Bạn có thể tiến hành giao hàng ngay.",
    "Buyer confirmed delivery. Funds were released to your demo wallet.":
      "Người mua xác nhận đã nhận hàng. Tiền thanh toán đã được cộng vào Ví Rehub của bạn.",
    "A dispute has been opened for this order.":
      "Đã mở yêu cầu khiếu nại liên quan đến Ví Rehub cho đơn hàng này.",
    "Buyer marked the order as completed.":
      "Người mua đã đánh dấu hoàn thành đơn hàng qua Ví Rehub.",
    "Seller updated order status: preparing package.":
      "Người bán đã cập nhật trạng thái: đang chuẩn bị hàng.",
    "Seller updated order status: shipping in progress.":
      "Người bán đã cập nhật trạng thái: đang giao hàng.",
    "The order was cancelled by the counterparty.":
      "Đơn hàng này đã bị hủy bởi đối tác.",
    "You received a new review from a completed order.":
      "Bạn nhận được 1 đánh giá mới từ đơn hàng đã hoàn tất.",
    "Người mua đã nạp tiền vào hệ thống đảm bảo. Bạn có thể tiến hành giao hàng.":
      "Người mua đã nạp tiền vào hệ thống đảm bảo. Bạn có thể tiến hành giao hàng.",
    "Người bán đã thông báo chuyển hàng. Vui lòng kiểm tra và xác nhận nhận hàng qua Ví Rehub.":
      "Người bán đã thông báo chuyển hàng. Vui lòng kiểm tra và xác nhận nhận hàng qua Ví Rehub.",
    "Người mua xác nhận đã nhận hàng. Tiền đã được cộng vào Ví Rehub của bạn.":
      "Người mua xác nhận đã nhận hàng. Tiền đã được cộng vào Ví Rehub của bạn.",
    "Đã có yêu cầu khiếu nại liên quan đến thanh toán qua Ví Rehub.":
      "Đã có yêu cầu khiếu nại liên quan đến thanh toán qua Ví Rehub.",
  };

  if (messageMap[message]) {
    translatedMessage = messageMap[message];
  } else if (message.includes("Admin resolved escrow with result:")) {
    const result = message.split(": ")[1];
    translatedMessage = `Admin đã giải quyết giao dịch Ví Rehub với kết quả: ${result}.`;
  } else if (message.includes("Admin đã giải quyết giao dịch với kết quả:")) {
    translatedMessage = message;
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
    translatedMessage = translatedMessage.replace(
      /You received a new offer for listing '(.+?)'\./i,
      "Bạn nhận được đề xuất giá mới cho tin đăng '$1'.",
    );
    translatedMessage = translatedMessage.replace(
      /Your offer for '(.+?)' was accepted\./i,
      "Đề xuất giá cho tin đăng '$1' đã được chấp nhận.",
    );
    translatedMessage = translatedMessage.replace(
      /Your offer for '(.+?)' was rejected\./i,
      "Đề xuất giá cho tin đăng '$1' đã bị từ chối.",
    );
    translatedMessage = translatedMessage.replace(
      /Your offer for '(.+?)' was countered\./i,
      "Đề xuất giá cho tin đăng '$1' đã có đề xuất giá lại.",
    );
    translatedMessage = translatedMessage.replace(
      /Buyer accepted your counter offer for '(.+?)'\./i,
      "Người mua đã chấp nhận đề xuất giá lại cho tin đăng '$1'.",
    );
    translatedMessage = translatedMessage.replace(
      /Buyer rejected your counter offer for '(.+?)'\./i,
      "Người mua đã từ chối đề xuất giá lại cho tin đăng '$1'.",
    );
    translatedMessage = translatedMessage.replace(
      /Your listing '(.+?)' has been approved\./i,
      "Tin đăng '$1' của bạn đã được duyệt.",
    );
    translatedMessage = translatedMessage.replace(
      /Your listing '(.+?)' has been rejected\./i,
      "Tin đăng '$1' của bạn đã bị từ chối.",
    );
    translatedMessage = translatedMessage.replace(
      /A buyer placed an order for your listing '(.+?)'\./i,
      "Một người mua đã đặt đơn hàng cho tin đăng '$1' của bạn.",
    );
  }

  return { title: translatedTitle, message: translatedMessage };
};
