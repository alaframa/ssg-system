"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface Branch {
  id: string;
  code: string;
  name: string;
}
interface BranchCtx {
  branches: Branch[];
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
}

const BranchContext = createContext<BranchCtx>({
  branches: [],
  activeBranchId: "",
  setActiveBranchId: () => {},
});

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState("");

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data: Branch[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data);
          setActiveBranchId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <BranchContext.Provider
      value={{ branches, activeBranchId, setActiveBranchId }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
