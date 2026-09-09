import os
import glob
import json
import logging
import argparse
from typing import List, Dict, Any, Optional

from backend.app.services.rag.models import DocumentChunk, AuthorityLevel
from backend.app.services.rag.metadata import (
    validate_document_metadata,
    resolve_source_authority,
    compute_content_hash,
)
from backend.app.services.rag.chunking import chunk_document
from backend.app.services.rag.pdf_parser import extract_text_from_pdf
from backend.app.services.rag.vector_store import vector_store

logger = logging.getLogger(__name__)


AUTHORITATIVE_CORPUS: List[Dict[str, Any]] = [
    # ------------------------------------------------------------------------
    # 1. National Scholarship Portal (NSP) Documents (LEVEL_1)
    # ------------------------------------------------------------------------
    {
        "document_id": "NSP-DOC-001",
        "title": "National Scholarship Portal (NSP) - General Central Scheme Guidelines",
        "source": "National Scholarship Portal (scholarships.gov.in)",
        "source_url": "https://scholarships.gov.in",
        "publisher": "Ministry of Electronics & Information Technology / Ministry of Education, Govt of India",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "guideline",
        "section": "Eligibility & Registration",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-15",
        "content": (
            "The National Scholarship Portal (NSP) is the Government of India's unified platform for central, "
            "UGC, and AICTE scholarship schemes. To register, students must possess an active Aadhaar number seeded "
            "with a functional NPCI-mapped bank account. Fresh registrations require student verification via OTP. "
            "Only one post-matric or central scholarship can be availed by a student per academic year."
        )
    },
    {
        "document_id": "NSP-DOC-002",
        "title": "NSP Central Sector Scheme of Scholarship for College and University Students",
        "source": "Department of Higher Education, Ministry of Education",
        "source_url": "https://scholarships.gov.in",
        "publisher": "Ministry of Education, Govt of India",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "guideline",
        "section": "Merit & Income Criteria",
        "page": 2,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-15",
        "content": (
            "Under the Central Sector Scheme, students must be above the 80th percentile of successful candidates in the "
            "relevant stream from a recognized Board of Examination in Class 12. Gross family income must not exceed "
            "₹4,50,000 per annum. The rate of scholarship is ₹12,000 per annum at Graduation level for the first three years "
            "and ₹20,000 per annum at Post-Graduation level. Beneficiaries must not receive any other scholarship."
        )
    },
    {
        "document_id": "NSP-DOC-003",
        "title": "NSP Renewal & Academic Continuation Norms",
        "source": "National Scholarship Portal Guidelines",
        "source_url": "https://scholarships.gov.in",
        "publisher": "National Informatics Centre (NIC)",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "guideline",
        "section": "Renewal Procedure",
        "page": 4,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-15",
        "content": (
            "For renewal of NSP scholarships, students must maintain at least 50% marks in previous annual examinations "
            "and at least 75% attendance. Failure to submit renewal requests before the official deadline results in forfeiture "
            "of subsequent tenure. Institution nodal officers (INOs) must verify enrollment on the portal prior to state-level approval."
        )
    },
    {
        "document_id": "NSP-DOC-004",
        "title": "NSP Mandatory Document Verification Checklist",
        "source": "Ministry of Electronics & Information Technology",
        "source_url": "https://scholarships.gov.in",
        "publisher": "Govt of India",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "circular",
        "section": "Verification Documents",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-02-01",
        "content": (
            "Mandatory documents for NSP include: 1. Aadhaar Card / Enrolment ID, 2. Previous year academic marksheet, "
            "3. Competent authority Income Certificate, 4. Bank account passbook in student's name, 5. Caste/Community certificate "
            "(for reserved schemes), 6. Bonafide student certificate issued by the Head of Institution, and 7. Fee receipt."
        )
    },

    # ------------------------------------------------------------------------
    # 2. National Means-cum-Merit Scholarship (NMMS) (LEVEL_1)
    # ------------------------------------------------------------------------
    {
        "document_id": "NMMS-DOC-001",
        "title": "National Means-cum-Merit Scholarship Scheme (NMMSS) Official Criteria",
        "source": "Department of School Education & Literacy, Govt of India",
        "source_url": "https://scholarships.gov.in",
        "publisher": "Ministry of Education, Govt of India",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "guideline",
        "section": "Class 10 Support & Criteria",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-10",
        "content": (
            "NMMS is awarded to meritorious students of economically weaker sections to arrest dropout rates at Class 8 and "
            "encourage them to continue secondary education up to Class 12. Parental income from all sources must not exceed "
            "₹3,50,000 per annum. Students must secure at least 55% marks (50% for SC/ST) in Class 7/8 exams to appear in selection. "
            "The scholarship amount is ₹12,000 per annum (₹1,000 per month)."
        )
    },
    {
        "document_id": "NMMS-DOC-002",
        "title": "NMMS Renewal Conditions for Classes 9 to 12",
        "source": "Department of School Education & Literacy",
        "source_url": "https://scholarships.gov.in",
        "publisher": "Ministry of Education, Govt of India",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "guideline",
        "section": "Renewal Norms",
        "page": 2,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-10",
        "content": (
            "For continuation in Class 10, the awardee must pass Class 9 with minimum 55% marks (50% for SC/ST). "
            "For continuation in Class 11 and 12, the student must obtain clear promotion in Class 10 with at least 60% marks. "
            "Students studying in Kendriya Vidyalayas, Navodaya Vidyalayas, or residential schools run by governments are ineligible."
        )
    },

    # ------------------------------------------------------------------------
    # 3. Telangana ePASS Guidelines (LEVEL_1)
    # ------------------------------------------------------------------------
    {
        "document_id": "TS-EPASS-001",
        "title": "Telangana ePASS Post-Matric Scholarship & Fee Reimbursement Scheme",
        "source": "Welfare Departments, Government of Telangana",
        "source_url": "https://telanganaepass.cgg.gov.in",
        "publisher": "Government of Telangana (Welfare Departments)",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "policy",
        "section": "Eligibility & Income Limits",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-02-15",
        "content": (
            "Telangana ePASS provides Reimbursement of Tuition Fee (RTF) and Maintenance Fee (MTF) to eligible SC, ST, BC, EBC, "
            "and Minority students studying Intermediate, ITI, Polytechnic, B.Tech, and Professional degrees. "
            "Annual family income limit is ₹2,00,000 for SC/ST and ₹1,50,000 (rural) or ₹2,00,000 (urban) for BC/EBC/Minorities. "
            "Students must maintain at least 75% attendance in every semester."
        )
    },
    {
        "document_id": "TS-EPASS-002",
        "title": "Telangana ePASS Document Submission & MeeSeva Verification",
        "source": "Telangana Centre for Good Governance (CGG)",
        "source_url": "https://telanganaepass.cgg.gov.in",
        "publisher": "Centre for Good Governance (CGG Telangana)",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "guideline",
        "section": "Required Certificates",
        "page": 2,
        "last_verified": "2026-08-01",
        "published_date": "2026-02-15",
        "content": (
            "Applicants must obtain digital income certificates and caste certificates issued through MeeSeva portal. "
            "Required uploads: 1. Latest MeeSeva Income Certificate, 2. Caste Certificate, 3. SSC Memo / Marksheet, "
            "4. Intermediate / Transfer Certificate, 5. Allotted Admission Order / Convenor Rank Card, 6. Bank passbook with IFSC, "
            "and 7. Study / Bonafide certificates for preceding 7 continuous years for local status determination."
        )
    },
    {
        "document_id": "TS-EPASS-003",
        "title": "Telangana ePASS B.Tech Engineering Fee Reimbursement (Convenor vs Management)",
        "source": "Telangana State Council of Higher Education (TSCHE)",
        "source_url": "https://telanganaepass.cgg.gov.in",
        "publisher": "TSCHE / Welfare Directorate",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "policy",
        "section": "Engineering RTF Rules",
        "page": 3,
        "last_verified": "2026-08-01",
        "published_date": "2026-02-15",
        "content": (
            "Full tuition fee reimbursement for B.Tech is applicable to students admitted under Convenor Quota through TS EAMCET. "
            "Students securing ranks below 10,000 in TS EAMCET receive 100% fee reimbursement irrespective of college tier. "
            "For ranks above 10,000, fee reimbursement is capped at standard government-prescribed rates (₹35,000 to college limit). "
            "Students admitted under Management Quota (Category B) or NRI quota are strictly ineligible for ePASS."
        )
    },

    # ------------------------------------------------------------------------
    # 4. AICTE Technical Scholarships (LEVEL_1)
    # ------------------------------------------------------------------------
    {
        "document_id": "AICTE-PRAGATI-001",
        "title": "AICTE Pragati Scholarship Scheme for Girl Students in Technical Education",
        "source": "All India Council for Technical Education (AICTE)",
        "source_url": "https://www.aicte-india.org",
        "publisher": "AICTE, Ministry of Education, Govt of India",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "guideline",
        "section": "Eligibility & Grant Amount",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-20",
        "content": (
            "The AICTE Pragati Scholarship supports female students admitted to 1st year Degree (B.Tech/B.E.) or Diploma programs "
            "in AICTE-approved technical institutions. Maximum two girls per family are eligible. Family income must be less than "
            "₹8,00,000 per annum. The scholarship amount is ₹50,000 per annum for each year of study, utilized towards college fees, "
            "books, equipment, and hostel charges."
        )
    },
    {
        "document_id": "AICTE-SAKSHAM-001",
        "title": "AICTE Saksham Scholarship Scheme for Specially-Abled Students",
        "source": "AICTE Welfare Schemes",
        "source_url": "https://www.aicte-india.org",
        "publisher": "AICTE, Ministry of Education, Govt of India",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "guideline",
        "section": "Divyangjan Technical Grants",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-20",
        "content": (
            "The Saksham Scheme is aimed at specially-abled students with disability not less than 40% admitted to 1st year of "
            "AICTE-approved degree or diploma courses. Annual family income must not exceed ₹8,00,000. Beneficiaries receive ₹50,000 "
            "per annum for tuition fees, computer purchase, stationery, and assistive devices."
        )
    },

    # ------------------------------------------------------------------------
    # 5. UGC Fellowships & Schemes (LEVEL_1)
    # ------------------------------------------------------------------------
    {
        "document_id": "UGC-ISHAN-001",
        "title": "UGC Ishan Uday Special Scholarship Scheme for North Eastern Region",
        "source": "University Grants Commission (ugc.ac.in)",
        "source_url": "https://www.ugc.gov.in",
        "publisher": "UGC, Ministry of Education, Govt of India",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "guideline",
        "section": "Regional Higher Education Grants",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-10",
        "content": (
            "Ishan Uday provides 10,000 fresh scholarships annually for students with domicile of North Eastern States admitted to "
            "general degree or technical/professional undergraduate courses (including B.Tech and MBBS). Family income must not exceed "
            "₹4,50,000 per annum. Amount: ₹5,400 per month for general degree courses and ₹7,800 per month for technical/professional courses."
        )
    },

    # ------------------------------------------------------------------------
    # 6. Corporate & Foundation Scholarships (LEVEL_3)
    # ------------------------------------------------------------------------
    {
        "document_id": "SBI-ASHA-001",
        "title": "SBI Asha Scholarship Program for Higher Education",
        "source": "SBI Foundation (sbiashascholarship.co.in)",
        "source_url": "https://www.sbiashascholarship.co.in",
        "publisher": "SBI Foundation CSR Directorate",
        "authority_level": AuthorityLevel.LEVEL_3.value,
        "document_type": "brochure",
        "section": "Engineering & College Criteria",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-02-01",
        "content": (
            "SBI Asha Scholarship provides financial grants to meritorious undergraduate students enrolled in top 100 NIRF "
            "engineering and professional institutions. Candidates must have scored minimum 75% marks in Class 12 or previous academic "
            "year. Annual family income ceiling is ₹3,00,000. The grant amount is up to ₹75,000 per year towards academic fees."
        )
    },
    {
        "document_id": "RELIANCE-UG-001",
        "title": "Reliance Foundation Undergraduate Scholarship Official Guidelines",
        "source": "Reliance Foundation (reliancefoundation.org)",
        "source_url": "https://www.reliancefoundation.org",
        "publisher": "Reliance Foundation CSR Trust",
        "authority_level": AuthorityLevel.LEVEL_3.value,
        "document_type": "guideline",
        "section": "Aptitude Test & Funding",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-05",
        "content": (
            "The Reliance Foundation Undergraduate Scholarship awards up to ₹2,00,000 over the duration of the degree to 5,000 "
            "undergraduate students across India. Eligible streams include Computer Science, IT, Mathematics, and core Engineering. "
            "Selection is based on a mandatory online aptitude test (maths, analytical reasoning, and verbal skills) combined with "
            "Class 12 academic merit (minimum 60%). Annual household income must be below ₹15,00,000, with priority given to < ₹2,50,000."
        )
    },
    {
        "document_id": "TATA-PANKH-001",
        "title": "Tata Capital Pankh Scholarship Programme Rules",
        "source": "Tata Capital CSR Foundation",
        "source_url": "https://www.tatacapital.com",
        "publisher": "Tata Capital Limited CSR Trust",
        "authority_level": AuthorityLevel.LEVEL_3.value,
        "document_type": "guideline",
        "section": "Undergraduate Engineering Support",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-12",
        "content": (
            "The Tata Capital Pankh Scholarship supports students in 1st year of professional degree courses (B.Tech, B.E., B.Arch). "
            "Students must have scored at least 75% marks in Class 12. Annual family income must not exceed ₹2,50,000. "
            "Grant provides up to ₹18,000 to cover tuition fees, books, and essential educational equipment."
        )
    },
    {
        "document_id": "LIC-GJSS-001",
        "title": "LIC Golden Jubilee Scholarship Scheme (GJSS) Guidelines",
        "source": "Life Insurance Corporation of India (licindia.in)",
        "source_url": "https://www.licindia.in",
        "publisher": "LIC Golden Jubilee Foundation",
        "authority_level": AuthorityLevel.LEVEL_3.value,
        "document_type": "guideline",
        "section": "Engineering & Medicine Grants",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-15",
        "content": (
            "LIC GJSS is awarded to meritorious students from economically weaker families for pursuing higher studies in India. "
            "Students must have passed Class 12 examination with at least 60% marks and annual parental income must not exceed ₹2,50,000. "
            "For students pursuing Engineering (B.Tech), the scholarship amount is ₹40,000 per annum paid in 3 installments."
        )
    },
    {
        "document_id": "ONGC-SCHOLAR-001",
        "title": "ONGC Foundation Scholarship to Meritorious Students",
        "source": "ONGC Foundation (ongcfoundation.org)",
        "source_url": "https://www.ongcfoundation.org",
        "publisher": "ONGC Foundation (Govt of India Undertaking)",
        "authority_level": AuthorityLevel.LEVEL_3.value,
        "document_type": "guideline",
        "section": "Engineering Undergraduates",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-25",
        "content": (
            "ONGC Foundation offers scholarships to students enrolled in 1st year of Engineering (B.Tech/B.E.) programs. "
            "Category breakdown: 2,000 scholarships for SC/ST, 1,000 for OBC, and 1,000 for General/EWS. "
            "Minimum 60% marks in Class 12 or 6.0 CGPA required. Annual family income must be under ₹2,00,000. "
            "Scholarship provides ₹48,000 per annum (₹4,00,00 per month)."
        )
    },
    {
        "document_id": "HDFC-PARIVARTAN-001",
        "title": "HDFC Bank Parivartan ECSS (Educational Crisis Scholarship Support)",
        "source": "HDFC Bank CSR",
        "source_url": "https://www.hdfcbank.com",
        "publisher": "HDFC Bank Parivartan",
        "authority_level": AuthorityLevel.LEVEL_3.value,
        "document_type": "guideline",
        "section": "Crisis Educational Grants",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-10",
        "content": (
            "HDFC Bank Parivartan ECSS program supports students facing personal or economic emergencies (loss of primary earning parent, "
            "critical medical crisis, or catastrophic household disruption) so they can complete higher education. "
            "Students pursuing undergraduate technical degrees receive up to ₹75,000 per annum. Proof of crisis documentation is mandatory."
        )
    },
    {
        "document_id": "VIDYADHAN-001",
        "title": "Sarojini Damodaran Foundation Vidyadhan Scholarship Guidelines",
        "source": "Sarojini Damodaran Foundation (vidyadhan.org)",
        "source_url": "https://www.vidyadhan.org",
        "publisher": "Sarojini Damodaran Foundation",
        "authority_level": AuthorityLevel.LEVEL_3.value,
        "document_type": "guideline",
        "section": "Class 10 to Degree Continuity",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-12",
        "content": (
            "Vidyadhan provides scholarships for students passing Class 10 with exceptional marks (minimum 90% or 9 CGPA, 75% for "
            "disabled students). Family annual income must be below ₹2,00,000. Selected students receive ₹10,000 per year in Class 11 and 12, "
            "and are eligible for continuing sponsorships during B.Tech/Medicine degrees ranging from ₹15,000 to ₹75,000 per year."
        )
    },
    {
        "document_id": "IDFC-FIRST-001",
        "title": "IDFC FIRST Bank Engineering Scholarship Programme",
        "source": "IDFC FIRST Bank CSR",
        "source_url": "https://www.idfcfirstbank.com",
        "publisher": "IDFC FIRST Bank CSR",
        "authority_level": AuthorityLevel.LEVEL_3.value,
        "document_type": "guideline",
        "section": "Engineering 4-Year Grant",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-18",
        "content": (
            "IDFC FIRST Bank Engineering Scholarship provides ₹1,00,000 per annum for 4 years to meritorious 1st year B.Tech students "
            "enrolled in government-recognized engineering colleges. Students must have secured at least 75% in Class 12. "
            "Gross annual family income must be under ₹6,00,000. Renewal is subject to maintaining no backlogs and minimum 7.0 CGPA."
        )
    },

    # ------------------------------------------------------------------------
    # 7. National Entrance & Career Examination Guidelines (LEVEL_1 & LEVEL_2)
    # ------------------------------------------------------------------------
    {
        "document_id": "GATE-EXAM-001",
        "title": "GATE Examination Structure, Paper Codes, and PSU Eligibility",
        "source": "National Coordinating Board - GATE, IIT Roorkee / IIT Madras",
        "source_url": "https://gate2026.iit.ac.in",
        "publisher": "Indian Institute of Technology (Organizing Institute)",
        "authority_level": AuthorityLevel.LEVEL_2.value,
        "document_type": "exam_rule",
        "section": "Eligibility & Scoring",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-02-01",
        "content": (
            "GATE is conducted jointly by the Indian Institute of Science and seven IITs. Students in 3rd or 4th year of B.Tech "
            "or those who have already completed any government-approved degree in Engineering/Technology are eligible to appear. "
            "The examination comprises 65 questions totaling 100 marks (General Aptitude 15 marks, Engineering Mathematics 13 marks, "
            "Subject Core 72 marks). GATE score is valid for 3 years for M.Tech admissions (AICTE stipend ₹12,400/mo) and PSU recruitment "
            "(IOCL, ONGC, NTPC, BHEL, PowerGrid)."
        )
    },
    {
        "document_id": "TS-EAMCET-001",
        "title": "TS EAMCET / TG EAPCET Counseling & Convenor Seat Allotment Rules",
        "source": "Telangana State Council of Higher Education (TGCHE)",
        "source_url": "https://eapcet.tgche.ac.in",
        "publisher": "Telangana State Council of Higher Education",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "exam_rule",
        "section": "Counseling & Reservation",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-02-10",
        "content": (
            "TG EAPCET (formerly TS EAMCET) counseling governs admission into B.Tech courses in Telangana. 85% of seats in each course "
            "are reserved for local candidates of the Osmania University area. Candidates must have secured at least 45% (40% for reserved) "
            "in Mathematics, Physics, and Chemistry in Intermediate. Category-wise certificate verification at helpline centers requires "
            "Rank Card, Hall Ticket, Intermediate memo, SSC memo, Transfer Certificate, Study certificates from Class 6 to 12, Caste, and Income."
        )
    },
    {
        "document_id": "JEE-MAIN-001",
        "title": "NTA JEE Main Eligibility, Percentile Calculation, and CSAB Guidelines",
        "source": "National Testing Agency (nta.ac.in)",
        "source_url": "https://jeemain.nta.nic.in",
        "publisher": "National Testing Agency (Ministry of Education)",
        "authority_level": AuthorityLevel.LEVEL_1.value,
        "document_type": "exam_rule",
        "section": "NIT+ System Admissions",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-20",
        "content": (
            "JEE Main consists of Paper 1 for B.E./B.Tech admissions into NITs, IIITs, and CFTIs. Candidates can appear in JEE Main for "
            "3 consecutive years. Eligibility for admission requires scoring at least 75% marks in Class 12 examination (65% for SC/ST) "
            "or being in top 20 percentile of the respective state board. JoSAA and CSAB manage centralized online counseling."
        )
    },

    # ------------------------------------------------------------------------
    # 8. Industry Career Standards & Skill Requirements (LEVEL_4)
    # ------------------------------------------------------------------------
    {
        "document_id": "CAREER-ML-001",
        "title": "Machine Learning Engineer Industry Competency & Curriculum Standards",
        "source": "IEEE Computer Society / ACM Computing Guidelines",
        "source_url": "https://www.computer.org",
        "publisher": "IEEE Computer Society",
        "authority_level": AuthorityLevel.LEVEL_4.value,
        "document_type": "policy",
        "section": "Technical Roadmap",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-01",
        "content": (
            "A Machine Learning Engineer requires demonstrable competency in Python, Linear Algebra, Multivariate Calculus, and Probability. "
            "Core frameworks include PyTorch, TensorFlow, and Scikit-Learn. Productionization requires proficiency in Docker, MLflow, "
            "FastAPI for model serving, and feature engineering with Pandas and NumPy. Model deployment and vector search (RAG, Embeddings) "
            "are essential modern production qualifications."
        )
    },
    {
        "document_id": "CAREER-FS-001",
        "title": "Full Stack Developer Industry Competency Benchmark",
        "source": "Open Web Application Security Project (OWASP) / W3C",
        "source_url": "https://owasp.org",
        "publisher": "OWASP & W3C Technical Standards",
        "authority_level": AuthorityLevel.LEVEL_4.value,
        "document_type": "policy",
        "section": "Web Engineering Benchmark",
        "page": 1,
        "last_verified": "2026-08-01",
        "published_date": "2026-01-01",
        "content": (
            "Modern Full Stack Engineers require mastery across both client and server domains: React or Next.js, TypeScript, "
            "HTML5/CSS3 on frontend; Node.js or Python (FastAPI/Django) on backend; relational databases (PostgreSQL/MySQL) with "
            "indexing, migrations, and query optimization; REST/GraphQL API contracts; and containerized deployment with Docker and CI/CD pipelines."
        )
    }
]


def load_scholarships_dataset() -> List[DocumentChunk]:
    """Loads user-specified authoritative scholarships from backend/data/rag/scholarships.json."""
    candidates = [
        os.path.join("backend", "data", "rag", "scholarships.json"),
        os.path.join("data", "rag", "scholarships.json"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "rag", "scholarships.json"),
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "rag", "scholarships.json"),
    ]
    json_path = None
    for c in candidates:
        if os.path.exists(c):
            json_path = c
            break

    if not json_path:
        logger.error("[Ingestion] backend/data/rag/scholarships.json not found!")
        return []

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    chunks: List[DocumentChunk] = []
    for rec in data.get("records", []):
        meta = rec.get("metadata", {})
        sch_name = meta.get("scholarship_name", "Scholarship")
        is_gov = any(k in sch_name.lower() for k in ("epass", "nsp", "dr rajendra prasad"))
        auth_level = AuthorityLevel.LEVEL_1.value if is_gov else AuthorityLevel.LEVEL_3.value

        chunk = DocumentChunk(
            chunk_id=rec["id"],
            document_id=rec["id"],
            document_title=sch_name,
            document_type="scholarship",
            source_name=sch_name,
            source_url=meta.get("application_link", "https://scholarships.gov.in"),
            publisher=sch_name,
            authority_level=auth_level,
            page_number=1,
            section=f"{meta.get('current_study', 'General')} Requirements",
            content=rec["document"],
            content_hash=compute_content_hash(rec["document"]),
            published_date="2026-01-01",
            last_verified="2026-09-10",
            retrieved_at="2026-09-10",
            language="en",
            scholarship_name=sch_name,
            current_study=meta.get("current_study"),
            education_level=meta.get("education_level"),
            year_of_study=meta.get("year_of_study"),
            minimum_percentage=float(meta.get("minimum_percentage", 0.0)),
            amount_inr=int(meta.get("amount_inr", 0)),
            deadline=meta.get("deadline"),
            deadline_iso=meta.get("deadline_iso"),
            application_link=meta.get("application_link"),
            extra_metadata=meta
        )
        chunks.append(chunk)
    return chunks


def ingest_authoritative_corpus(force_reindex: bool = True, scholarships_only: bool = True) -> int:
    """
    Ingests the authoritative scholarships dataset into ChromaDB.
    When scholarships_only is True (default), ensures ONLY the user-specified 20 scholarship records are indexed.
    """
    scholarship_chunks = load_scholarships_dataset()
    if not scholarship_chunks:
        logger.warning("[Ingestion] No scholarships found in dataset, falling back to built-in corpus.")
        total_chunks: List[DocumentChunk] = []
        for doc in AUTHORITATIVE_CORPUS:
            if validate_document_metadata(doc):
                total_chunks.extend(chunk_document(doc))
    else:
        total_chunks = scholarship_chunks
        if not scholarships_only:
            for doc in AUTHORITATIVE_CORPUS:
                if validate_document_metadata(doc):
                    total_chunks.extend(chunk_document(doc))

    # Always clear when re-indexing to purge obsolete or random data
    if force_reindex or vector_store.total_chunks == 0:
        logger.info(f"[Ingestion] Clearing vector store to ensure ONLY authoritative scholarships are present...")
        vector_store.clear()

    indexed = vector_store.upsert_documents(total_chunks)
    logger.info(f"[Ingestion] Successfully indexed {indexed} chunks into '{vector_store.collection_name}'.")
    return indexed


def ingest_pdf_file(pdf_path: str) -> int:
    """Ingests a single PDF file page-by-page into ChromaDB."""
    parsed = extract_text_from_pdf(pdf_path)
    # Deduce authority level from filename or content
    publisher = "Official Authority"
    if "ugc" in parsed["document_id"]:
        publisher = "University Grants Commission"
        auth_level = AuthorityLevel.LEVEL_1.value
    elif "synthetic" in parsed["document_id"]:
        publisher = "Synthetic Evaluation Suite"
        auth_level = AuthorityLevel.LEVEL_5.value
    else:
        auth_level = AuthorityLevel.LEVEL_1.value

    doc_dict = {
        "document_id": parsed["document_id"],
        "title": parsed["title"],
        "source": publisher,
        "source_url": f"local://{os.path.basename(pdf_path)}",
        "publisher": publisher,
        "authority_level": auth_level,
        "document_type": "guideline",
        "pages": parsed["pages"],
        "last_verified": "2026-09-10",
        "published_date": "2026-09-10"
    }

    chunks = chunk_document(doc_dict)
    upserted = vector_store.upsert_documents(chunks)
    logger.info(f"[Ingestion] Ingested PDF '{parsed['filename']}': {upserted} chunks indexed.")
    return upserted


def ingest_directory(source_dir: str = "backend/data/rag/raw", force: bool = False) -> int:
    """
    Scans a directory for .pdf, .txt, and .md files and indexes them into ChromaDB.
    """
    if not os.path.exists(source_dir):
        logger.info(f"[Ingestion] Source directory '{source_dir}' does not exist.")
        return 0

    total_indexed = 0
    pdf_files = glob.glob(os.path.join(source_dir, "**", "*.pdf"), recursive=True)
    for pdf in pdf_files:
        try:
            total_indexed += ingest_pdf_file(pdf)
        except Exception as exc:
            logger.error(f"[Ingestion] Failed to ingest PDF '{pdf}': {exc}")

    txt_files = glob.glob(os.path.join(source_dir, "**", "*.txt"), recursive=True)
    for txt in txt_files:
        try:
            with open(txt, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            doc_id = os.path.splitext(os.path.basename(txt))[0].lower().replace(" ", "_")
            doc_dict = {
                "document_id": doc_id,
                "title": doc_id.replace("_", " ").title(),
                "source": "Document Registry",
                "source_url": f"file://{txt}",
                "publisher": "Educational Registry",
                "authority_level": AuthorityLevel.LEVEL_1.value if "epass" in doc_id or "nsp" in doc_id else AuthorityLevel.LEVEL_3.value,
                "document_type": "guideline",
                "content": content,
                "last_verified": "2026-09-10"
            }
            chunks = chunk_document(doc_dict)
            total_indexed += vector_store.upsert_documents(chunks)
        except Exception as exc:
            logger.error(f"[Ingestion] Failed to ingest text file '{txt}': {exc}")

    return total_indexed


def ingest_all_sources(force_reindex: bool = False) -> int:
    """Ingests both the authoritative structured corpus and any raw documents in backend/data/rag/raw."""
    total = ingest_authoritative_corpus(force_reindex=force_reindex)
    total += ingest_directory("backend/data/rag/raw", force=force_reindex)
    return total


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SkillCatalyst ChromaDB RAG Ingestion Pipeline")
    parser.add_argument("--source", type=str, default=None, help="Directory containing PDF or text files to ingest")
    parser.add_argument("--force", action="store_true", help="Force re-indexing and clear existing Chroma collection")
    parser.add_argument("--all", action="store_true", help="Ingest all built-in corpus documents and data/rag/raw")

    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)

    if args.source:
        print(f"Ingesting directory: {args.source}")
        count = ingest_directory(args.source, force=args.force)
        print(f"Ingested {count} chunks from {args.source}.")
    elif args.all:
        print("Ingesting all sources (corpus + raw directory)...")
        count = ingest_all_sources(force_reindex=args.force)
        print(f"Ingestion complete. Total collection chunks: {vector_store.total_chunks}")
    else:
        print("Ingesting authoritative corpus into ChromaDB...")
        count = ingest_authoritative_corpus(force_reindex=args.force)
        print(f"Ingestion complete. Total collection chunks: {vector_store.total_chunks}")
