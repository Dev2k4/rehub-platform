import logging
import random

logger = logging.getLogger(__name__)


def generate_otp_code(length: int = 6) -> str:
    lower = 10 ** (length - 1)
    upper = (10 ** length) - 1
    return str(random.randint(lower, upper))


def send_phone_otp(phone: str, otp_code: str) -> None:
    logger.info("Sending phone OTP %s to %s", otp_code, phone)
