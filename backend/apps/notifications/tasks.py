from celery import shared_task


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_convocation_email_task(self, candidate_id: int) -> None:
    """
    TODO: fetch candidate + exam schedule and send convocation email.
    """
    _ = candidate_id


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def generate_pv_pdf_task(self, pv_document_id: int) -> None:
    """
    TODO: render and persist official PV PDF.
    """
    _ = pv_document_id
