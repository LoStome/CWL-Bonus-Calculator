import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card, SectionTitle } from "@/components/ui";

interface CwlSeasonCardProps {}

export const CwlCurrentSeasonCard: React.FC<CwlSeasonCardProps> = ({}) => {
  return (
    <Card>
      {" "}
      <div className="flex items-center justify-between">
        <SectionTitle>Current CWL Season</SectionTitle>
        text
      </div>
    </Card>
  );
};
