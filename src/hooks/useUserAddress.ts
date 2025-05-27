
import { useEffect, useState } from "react";
import { useTonWallet } from '@tonconnect/ui-react';

/**
 * Hook to get the currently "logged-in" user's TON address.
 * Now uses the actual connected wallet address.
 */
export function useUserAddress() {
  const wallet = useTonWallet();
  const [address, setAddress] = useState<string | undefined>();

  useEffect(() => {
    if (wallet?.account?.address) {
      setAddress(wallet.account.address);
    } else {
      // Fallback to demo address if no wallet connected
      setAddress('demo-user-address');
    }
  }, [wallet?.account?.address]);

  return address;
}
