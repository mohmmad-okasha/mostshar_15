"use client"; // Ensures this is a client component

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from 'antd';
import axios from 'axios';
import {
    getApiUrl,
    saveLog,
} from "@/app/shared";

const api = getApiUrl();

function LanguageChanger() {
    const router = useRouter();
    const [asPath, setAsPath] = useState('');
    const [userLang, setUserLang] = useState(''); // Store user's language preference
    const [isArabicLocale, setIsArabicLocale] = useState(false);
    const userName = window?.localStorage?.getItem("userName") ;

    // Fetch user's preferred language from database on mount
    useEffect(() => {
        setAsPath(window?.location.pathname);

        // Fetch language preference from backend
        const fetchUserLang = async () => {
            try {
                const response = await axios.get(`${api}/users/${userName}`); // API endpoint
                const lang = response.data.settings.lang; // Assume response includes { language: 'en' }
                setUserLang(lang);
                setIsArabicLocale(asPath.includes(`/${lang}`));
            } catch (error) {
                console.error('Error fetching language preference:', error);
            }
        };

        fetchUserLang();
    }, [asPath]);

    // Handle button click to change locale and update DB
    const handleLocaleChange = async (locale) => {
        try {
            const newPath = isArabicLocale
                ? asPath.replace('/ar', `/${locale}`)
                : `/${locale}${asPath}`;

            // Update language preference in backend
            const user = await axios.get(`${api}/users/${userName}`); // API endpoint
            const settings = {
                ...user.data?.settings,
                lang: locale,
            }

            await axios.post(`${api}/users/changeLang`, { userName: userName, settings: settings }); // API endpoint
            setUserLang(locale);
            setIsArabicLocale(locale === 'ar');
            router.push(newPath);
        } catch (error) {
            console.error('Error updating language preference:', error);
        }
    };

    return (
        <div>
            <Button
                onClick={() => handleLocaleChange('en')}
                disabled={userLang === 'en'}
            >
                EN
            </Button>
            <Button
                onClick={() => handleLocaleChange('ar')}
                disabled={userLang === 'ar'}
            >
                AR
            </Button>
        </div>
    );
}

export default LanguageChanger;
