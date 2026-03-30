import { useEffect } from 'react';

interface MetaDataProps {
  title?: string;
  description?: string;
  keywords?: string;
}

const MetaData = ({ 
  title = "Adukul - Best Free School Management System for Bihar & India", 
  description = "Adukul is India's leading digital school ERP, especially designed for Bihar. Manage fees, attendance, results, and homework for schools in Patna, Gaya, and across Bihar.",
  keywords = "School Management System Bihar, Best School ERP Patna, Free School Software Bihar, Adukul, Bihar Education Digitalization, School ERP India"
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
