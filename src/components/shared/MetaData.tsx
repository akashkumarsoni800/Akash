import { useEffect } from 'react';

interface MetaDataProps {
  title?: string;
  description?: string;
  keywords?: string;
}

const MetaData = ({ 
  title = "Tekool - Free School Management System India", 
  description = "The best free School Management System in India. Manage fees, attendance, results, and homework with ease.",
  keywords = "Tekool, School Management System, India, Free School Software"
}: MetaDataProps) => {
  
  useEffect(() => {
    // 🏷️ Update Title
    document.title = title.includes('Tekool') ? title : `${title} | Tekool`;

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
