"""
PDF Generation utilities using ReportLab
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.utils import timezone
from django.conf import settings
import os
from datetime import datetime

from api.models import PVReport, Deliberation, Candidate


def generate_pv_report(session, created_by, title=None):
    """
    Generate PV (Procès-Verbal) report PDF
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    
    if not title:
        title = f"PV_Deliberation_{session.name}_{session.year}"
    
    # Create filename
    filename = f"{title}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(settings.MEDIA_ROOT, 'pv', filename)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Create PDF
    doc = SimpleDocTemplate(filepath, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=1,  # Center
        spaceAfter=30
    )
    elements.append(Paragraph(f"PROCÈS-VERBAL DE DÉLIBÉRATION", title_style))
    elements.append(Paragraph(f"{session.name} - {session.year}", styles['Heading2']))
    elements.append(Spacer(1, 0.5*inch))
    
    # Date
    elements.append(Paragraph(
        f"Date: {timezone.now().strftime('%d/%m/%Y %H:%M')}",
        styles['Normal']
    ))
    elements.append(Spacer(1, 0.5*inch))
    
    # Get deliberation results
    deliberations = Deliberation.objects.filter(
        session=session
    ).select_related('candidate').order_by('rank')
    
    # Create table data
    table_data = [['Rang', 'N° Candidat', 'Nom et Prénom', 'Note Finale', 'Décision']]
    
    for d in deliberations:
        table_data.append([
            str(d.rank) if d.rank else '-',
            d.candidate.application_number,
            f"{d.candidate.last_name} {d.candidate.first_name}",
            f"{d.final_score:.2f}",
            d.decision
        ])
    
    # Create table
    table = Table(table_data, colWidths=[1*inch, 1.5*inch, 2.5*inch, 1.2*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (3, 1), (3, -1), 'RIGHT'),
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Summary
    total_admitted = deliberations.filter(decision='ADMITTED').count()
    total_waitlist = deliberations.filter(decision='WAITLIST').count()
    total_rejected = deliberations.filter(decision='REJECTED').count()
    
    summary_data = [
        ['Résumé', ''],
        ['Admis', str(total_admitted)],
        ['Liste d\'attente', str(total_waitlist)],
        ['Rejetés', str(total_rejected)],
        ['Total', str(deliberations.count())]
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 1*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 1*inch))
    
    # Signatures
    elements.append(Paragraph("Signatures:", styles['Heading3']))
    elements.append(Spacer(1, 0.3*inch))
    
    signature_data = [
        ['Le Président du Jury', 'Le Chef de département', 'Le Coordinateur'],
        ['', '', ''],
        ['', '', '']
    ]
    
    signature_table = Table(signature_data, colWidths=[2*inch, 2*inch, 2*inch])
    signature_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('LINEABOVE', (0, 1), (-1, 1), 1, colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ]))
    
    elements.append(signature_table)
    
    # Build PDF
    doc.build(elements)
    
    # Create PV report record
    pv = PVReport.objects.create(
        title=title,
        session=session,
        pdf_file=f'pv/{filename}',
        created_by=created_by
    )
    
    return pv


def generate_call_list(session, room=None):
    """
    Generate call list PDF for attendance
    """
    # Similar implementation to above
    # Would create a PDF with candidate list for attendance marking
    pass


def generate_anonymization_pv(session, generated_by):
    """
    Generate PV for anonymization process
    """
    # Similar implementation
    pass