from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_invite_email_task(self, email: str, invite_link: str) -> None:
    send_mail(
        subject="ConcoursDoctor — Your Account Invitation",
        message=(
            f"You have been invited to join the ConcoursDoctor platform.\n\n"
            f"Set your password by visiting the following link:\n{invite_link}\n\n"
            f"This link expires in 48 hours. If you did not expect this invitation, ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def notify_admin_lockout_task(self, user_email: str) -> None:
    from django.contrib.auth import get_user_model

    User = get_user_model()
    admin_emails = list(
        User.objects.filter(role="ADMIN", is_active=True)
        .exclude(email=user_email)
        .values_list("email", flat=True)
    )

    if not admin_emails:
        return

    send_mail(
        subject="ConcoursDoctor — Account Lockout Alert",
        message=(
            f"The account for {user_email} has been temporarily locked "
            f"due to repeated failed login attempts (3 consecutive failures).\n\n"
            f"This is an automated security notification."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=admin_emails,
        fail_silently=False,
    )
