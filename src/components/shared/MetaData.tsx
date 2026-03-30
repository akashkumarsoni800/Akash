import { useEffect } from 'react';

interface MetaDataProps {
  title?: string;
  description?: string;
  keywords?: string;
}

const MetaData = ({ 
  title = "Adukul - Best Free School Management System Bihar & India", 
  description = "Adukul is the most powerful free School Management System in India and Bihar. Highly secure ERP for managing fees, attendance, results, and digital admissions.",
  keywords = "Adukul, Free School Management System, India, Bihar, School ERP, Free School Software, Best School ERP Patna, Digital School, School Fee Tracker, Akash Kumar, CEO Akash Kumar, Patna, Gaya, Muzaffarpur, Bhagalpur, Purnia, Darbhanga, Arrah, Begusarai, Katihar, Munger, Chapra, Sasaram, Saharasa, Hajipur, Siwan, Motihari, Nawada, Bettiah, Baharapur, Aurangabad, Lakhisarai, Jamui, Khagaria, Samastipur, Madhubani, Jehanabad, Arwal, Buxar, Rohtas, Gopalganj, Kishanganj, Sheikhpura, Sheohar, Sitamarhi, Supaul, Madhepura, Araria, Bihar School Software, Bihar Education ERP, Patna Digital School, Free ERP for Schools, School Management System India, Student Information System, Staff Management System, Online Fee Payment, Biometric Attendance School, SMS Alerts for Schools, Automated Result Cards, Digital ID Cards, QR Code Student Tracking, School Transport Management, Bus GPS Tracking Bihar, Library Management System Free, Inventory Management School, Teacher Salary Management, Lesson Planning Software, Homework Management Digital, Parental Portal School, Student Dashboard App, Teacher App Bihar, Mobile App for Schools, Cloud Based School ERP, Secure Educational Software, Open Source School ERP, Primary School Management, Secondary School Management, CBSE School Software, ICSE School Software, Bihar Board School ERP, BSEB Online Results, Play School Management, Coaching Center Software Patna, Institute Management System, University Management Software, Educational ERP India, Smart Campus Solutions, Digital Campus India, 21st Century Schooling, EduTech Bihar, Startup Bihar Education, Digital Bihar Initiative, School Automation Software, Administrative Software for Schools, School Management ERP Patna, School Management Software Gaya, School Management Software Muzaffarpur, School Management Software Bhagalpur, School Management Software Purnia, School Management Software Darbhanga, Best School ERP in Arrah, Best School ERP in Begusarai, Best School ERP in Katihar, Best School ERP in Munger, Best School ERP in Chapra, Best School ERP in Sasaram, Best School ERP in Hajipur, Best School ERP in Siwan, Best School ERP in Motihari, School Administrator Tool, Principal Dashboard, Teacher Performance Tracker, Student Gradebook Online, Fee Receipt Generator, Payment Gateway Integration School, Admission Management Bihar, School Enquiry Management, Lead Management for Schools, Bulk SMS Schools Bihar, Email Marketing for Schools, School Event Management, Calendar Management School, Notice Board Digital, Communication Hub School, Secure Data Hosting Education, Supabase School ERP, React School Management, Vite SEO Optimized School, PWA Education Bihar, Offline School App, Desktop App for Schools, Windows School Software, MacOS School Software, Linux School ERP, Ubuntu School Management, Multilingual School Software, Hindi School Management System, English School ERP, Localized School Software Bihar, Affordable ERP for Schools, Scalable School Management, Multi-School Management System, Educational Chain Management, Group of Schools ERP, Franchisee Management School, CBSE Compliance Software, NCERT Based School ERP, Private School Management Bihar, Government School Digitalization, Smart Class Management, Online Examination System, CBT School Bihar, Virtual Classroom Tools, Integrated School ERP, All In One School Software, User Friendly School ERP, Customizable School Management, White Label School ERP, Branded School App, High Performance School ERP, Lightweight School Software, Fast Loading School ERP, Professional School Management, Reliable School ERP India, Trusted School Software Bihar, Top Rated School ERP, 5 Star School Management, Best User Experience School, Clean UI School ERP, Modern Design School Software, Responsive School ERP, Mobile First Education System, Future of Education Bihar, Digital India School, PM Shri Schools Digital, National Education Policy Software, NEP 2020 Compliant ERP, Skills Based Education Tracking, Holistic Report Cards Bihar, Activity Based Learning Management, Interactive School ERP, Engaging Student Portal, Collaborative Teacher Tools, Efficient School Administration, Cost Effective School ERP, 100% Free School Management, Unlimited Students ERP, Unlimited Teachers ERP, Unlimited Schools ERP, Enterprise Grade School Software, High Security School Records, Encrypted Student Data, Privacy First School ERP, GDPR Compliant Education Software, Data Protection School Bihar, Local Server School Management, Hybrid Cloud School ERP, Disaster Recovery School Data, Automated Backup School ERP, 24/7 Support School Software, Dedicated Support Bihar, Local Training Schools Patna, Onboarding Support Schools, Easy Migration School ERP, Data Import Tool School, Excel Export School Records, CSV Import Student Data, PDF Report Card Generator, Excel Fee Report, Graphical Analytics School, Real Time School Statistics, Daily Attendance Report, Monthly Performance Review, Year End School Summary, Alumni Management System, Placement Tracking Institute, Career Counseling Software, Skill Development Tracking, Vocational Training Management, Professional Development Teacher, Continuous Evaluation School, CCE Report Cards Bihar, Modern Pedagogical Tools, Innovative School Management, Leading EduTech Bihar, Top Startup Patna, Akash Kumar Tech, Adukul Innovation, Future Ready Schools Bihar, Global Standard School ERP, World Class Education Software, Elite School Management System, Premium School ERP Free, Best Value School Software, Essential School Features, Comprehensive School ERP, Detailed Student Profile, Holistic School Management, End To End School Solution, Unified Educational Platform, Integrated Learning Management, ILM Bihar, LMS Patna, Professional School Operations, Systematic School Administration, Methodical School Management, Organized School Records, Error Free School Accounting, Transparent Fee Structure, Account Management for Schools, Financial ERP for Schools, Audit Ready School Software, Tax Compliant School ERP, GST Ready School Software, Tally Integration School, Modern Accounting for Schools, Intuitive Navigation School ERP, Quick Access School Features, Single Sign On Education, Secure Authentication School, Multi Factor Auth School app, Role Based Access Control School, Fine Grained Permissions ERP, Super Admin Dashboard, Sub Admin Permissions, Front Office Management, Visitor Tracking School, Gate Pass Generator, Hostel Management System, Canteen Management School, Fee Concession Management, Scholarship Management Bihar, Academic Management System, Curriculum Designer School, Syllabus Tracker Digital, Subject Management School, Class Management ERP, Section Management School App, Student Promotion Management, TC Generator Online, Transfer Certificate School, Character Certificate Generator, Bonafide Certificate Generator, ID Card Printing Service Bihar, Custom Report Designer School, Data Driven School Decisions, Evidence Based Education Management, Scientific School Administration, Logical School ERP, Rational Education Software, Cognitive Learning Tracking, Behavioral Assessment School, Extracurricular Activity Tracker, Sports Management School, Health Records School, Vaccination Tracker Student, Emergency Contact Management, Parent Teacher Meeting Scheduler, PTM Management Online, School Survey Tool, Feedback System Schools, Suggestion Box Digital, Complaint Management School, School Rating System, Benchmark Testing Software, Standardized Testing Management, Academic Achievement Tracker, Awards Management School, Digital Badges for Students, Gamified Learning System, Interactive Quiz App, Educational Podcast Hosting, Video Lesson Management, E-book Library School, Digital Document Management, Paperless School Initiative, Eco Friendly School ERP, Green Campus Management, Sustainable Schooling Tools, Future Leaders Tracking, Character Building Software, Ethics Training Management, Moral Science Records, Holistic Growth Tracking, Well Being Monitor Student, Stress Management Schools, Counseling Record Management, Psychology Based Education Tools, Advanced School ERP India, High End School Software Bihar, Luxury School Management, Elite Education Platform, Top School ERP 2024, Top School ERP 2025, Top School ERP 2026, Latest School Software Trends, Emerging EdTech Bihar, Disruptive School ERP, Game Changing Education Software, Best ERP for New Schools, Best ERP for Established Schools, Best ERP for Large Schools, Best ERP for Small Schools, Best ERP for Rural Schools, Best ERP for Urban Schools, Inclusive Education Software, Adaptive Learning Systems, Personalized Education ERP"
}: MetaDataProps) => {
  
  useEffect(() => {
    // 🏷️ Update Title
    document.title = title.includes('Adukul') ? title : `${title} | Adukul`;

    // 📝 Update Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // 🔑 Update Keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    } else {
      const meta = document.createElement('meta');
      meta.name = "keywords";
      meta.content = keywords;
      document.head.appendChild(meta);
    }
    
    // 🌐 Update OG Title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    // 🌐 Update OG Description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

  }, [title, description, keywords]);

  return null; // This component doesn't render anything
};

export default MetaData;
