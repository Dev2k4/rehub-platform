from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings
from app.core.email import send_email
from app.models.order import Order
from app.models.user import User

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def _render(template_name: str, context: dict) -> str:
    template = _env.get_template(template_name)
    return template.render(**context)


async def send_verify_email(to_email: str, full_name: str, verification_token: str) -> bool:
    verification_url = f"{settings.FRONTEND_HOST}/auth/verify-email?token={verification_token}"
    html = _render(
        "verify_email.html",
        {
            "full_name": full_name,
            "verification_url": verification_url,
            "project_name": settings.PROJECT_NAME,
            "expires_hours": settings.EMAIL_VERIFICATION_EXPIRE_HOURS,
        },
    )
    return await send_email(
        to_email=to_email,
        subject="Verify your email",
        html_content=html,
        plain_content=f"Hello {full_name}, verify your email: {verification_url}",
    )


async def send_password_reset_email(to_email: str, full_name: str, reset_token: str) -> bool:
    reset_url = f"{settings.FRONTEND_HOST}/auth/login?reset_token={reset_token}"
    html = _render(
        "reset_password.html",
        {
            "full_name": full_name,
            "reset_url": reset_url,
            "project_name": settings.PROJECT_NAME,
            "expires_hours": settings.PASSWORD_RESET_EXPIRE_HOURS,
        },
    )
    return await send_email(
        to_email=to_email,
        subject="Reset your password",
        html_content=html,
        plain_content=f"Hello {full_name}, reset your password: {reset_url}",
    )


async def send_welcome_email(to_email: str, full_name: str) -> bool:
    html = _render(
        "welcome.html",
        {
            "full_name": full_name,
        },
    )
    return await send_email(
        to_email=to_email,
        subject="Welcome to ReHub",
        html_content=html,
        plain_content=f"Hello {full_name}, your email is verified. Welcome to ReHub!",
    )


async def send_order_created_email(buyer: User, seller: User, order: Order, listing_title: str) -> None:
    buyer_html = _render(
        "order_created.html",
        {
            "full_name": buyer.full_name,
            "order_id": str(order.id),
            "listing_title": listing_title,
            "final_price": str(order.final_price),
            "role": "buyer",
        },
    )
    seller_html = _render(
        "order_created.html",
        {
            "full_name": seller.full_name,
            "order_id": str(order.id),
            "listing_title": listing_title,
            "final_price": str(order.final_price),
            "role": "seller",
        },
    )

    await send_email(
        to_email=buyer.email,
        subject="Order created successfully",
        html_content=buyer_html,
    )
    await send_email(
        to_email=seller.email,
        subject="You received a new order",
        html_content=seller_html,
    )


async def send_order_completed_email(buyer: User, seller: User, order: Order) -> None:
    buyer_html = _render(
        "order_completed.html",
        {
            "full_name": buyer.full_name,
            "order_id": str(order.id),
            "final_price": str(order.final_price),
        },
    )
    seller_html = _render(
        "order_completed.html",
        {
            "full_name": seller.full_name,
            "order_id": str(order.id),
            "final_price": str(order.final_price),
        },
    )

    await send_email(
        to_email=buyer.email,
        subject="Order completed",
        html_content=buyer_html,
    )
    await send_email(
        to_email=seller.email,
        subject="Order completed",
        html_content=seller_html,
    )
