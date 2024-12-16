"use client"; // Ensures this is a client component

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button ,Dropdown } from 'antd'
function LanguageChanger() {
    const router = useRouter();
    const [asPath, setAsPath] = useState('');

    // Use useEffect to set the path when the component mounts
    useEffect(() => {
        setAsPath(window.location.pathname);
    }, []);

    // Check if '/ar' exists in the URL
    const isArabicLocale = asPath.includes('/ar');

    // Handle button click to change locale
    const handleLocaleChange = (locale) => {
        const newPath = isArabicLocale
            ? asPath.replace('/ar', `/${locale}`)
            : `/${locale}${asPath}`;
        router.push(newPath);
    };

    return (
        <div>
            <Button
                onClick={() => handleLocaleChange('en')}
                disabled={!isArabicLocale}
            >
                EN
            </Button>
            <Button
                onClick={() => handleLocaleChange('ar')}
                disabled={isArabicLocale}
            >
                AR
            </Button>
        </div>
    );
}

export default LanguageChanger;
