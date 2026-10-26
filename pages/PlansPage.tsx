import React, { useState, useEffect } from 'react';
import { PremiumPlans } from '../components/PremiumPlans';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const PlansPage: React.FC = () => {
  const { isPremium } = useAuth();
  const [stripeInfo, setStripeInfo] = useState<{ currency?: string; amount_monthly?: number; amount_yearly?: number } | null>(null);
  const [, setLoadingStripe] = useState(false);

  const loadStripeInfo = async () => {
    try {
      setLoadingStripe(true);
      const { data } = await supabase.functions.invoke('get-stripe-prices');
      const db = (data as any)?.db;
      if (db) setStripeInfo({ currency: db.currency, amount_monthly: db.amount_monthly, amount_yearly: db.amount_yearly });
    } finally {
      setLoadingStripe(false);
    }
  };

  useEffect(() => {
    loadStripeInfo();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Planos Disponíveis</h1>
      <PremiumPlans
        isPremium={!!isPremium}
        stripeInfo={stripeInfo}
        onRefreshStripeInfo={loadStripeInfo}
      />
    </div>
  );
};

export default PlansPage;
