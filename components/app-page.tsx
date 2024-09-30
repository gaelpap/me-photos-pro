'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateImage } from './actions'
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { UserImages } from './UserImages'
import { User } from 'firebase/auth';
import { doc, getDoc, updateDoc, increment, collection, setDoc } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';
import Image from 'next/image';
import { Select } from "@/components/ui/select"
import { useSearchParams } from 'next/navigation';

declare const rewardful: any;
declare const Rewardful: any;

interface LoRA {
  path: string;
  scale: number;
}

export function Page() {
  const [prompt, setPrompt] = useState('')
  const [loras, setLoras] = useState<LoRA[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [disableSafetyChecker, setDisableSafetyChecker] = useState(false)
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [language, setLanguage] = useState('en')
  const [translatedPrompt, setTranslatedPrompt] = useState('')
  const [referral, setReferral] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const router = useRouter()

  useEffect(() => {
    const checkCredits = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userCredits = userDoc.data()?.imageCredits || 0;
        setCredits(userCredits);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        checkCredits();
      } else {
        setCredits(0);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).rewardful) {
      rewardful('ready', function() {
        if (Rewardful.referral) {
          setReferral(Rewardful.referral);
        }
      });
    }
  }, []);

  // ... (rest of the existing functions like handleAddLora, handleRemoveLora, handleLoraChange, translatePrompt)

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (existing handleSubmit function remains unchanged)
  };

  const handleLogout = async () => {
    // ... (existing handleLogout function remains unchanged)
  };

  const handlePurchaseCredits = async () => {
    if (!user) {
      alert('Please log in to purchase credits.');
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/purchase-image-credits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referral, email: user.email }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.sessionId) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) {
          throw error;
        }
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to initiate purchase. Please try again.');
    }
  };

  const checkPaymentStatus = async (sessionId: string) => {
    // ... (existing checkPaymentStatus function remains unchanged)
  };

  useEffect(() => {
    // Check for session_id in URL
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [searchParams]);

  // ... (rest of the component render remains unchanged)
}