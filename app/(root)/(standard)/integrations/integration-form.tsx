"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveIntegration } from "@/lib/actions/integration.actions";

export default function IntegrationForm() {
  const [service, setService] = useState("");
  const [credential, setCredential] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !credential) return;
    await saveIntegration({ service, credential });
    setService("");
    setCredential("");
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        placeholder="Service (e.g. gmail)"
        value={service}
        onChange={(e) => setService(e.target.value)}
      />
      <Input
        placeholder="API Key or credential"
        value={credential}
        onChange={(e) => setCredential(e.target.value)}
      />
      <Button type="submit">Save</Button>
    </form>
  );
}
