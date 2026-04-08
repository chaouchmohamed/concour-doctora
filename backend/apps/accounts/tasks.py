from celery import shared_task


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_invite_email_task(self, email: str, invite_link: str) -> None:
    """
    TODO: integrate SMTP template and send account invitation email.
    """
    _ = (email, invite_link)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def notify_admin_lockout_task(self, user_email: str) -> None:
    """
    TODO: notify administrators after repeated failed login attempts.
    """
    _ = user_email
