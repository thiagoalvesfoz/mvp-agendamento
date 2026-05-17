import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Layout base compartilhado pelos templates.
 *
 * Mantém inline-styles porque clientes de email descartam <style>.
 * Componentes são SÍNCRONOS — `@react-email/render` não suporta async.
 */

interface ShellProps {
  preview: string;
  heading: string;
  children: ReactNode;
}

export function Shell({ preview, heading, children }: ShellProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={headingStyle}>{heading}</Heading>
          </Section>
          <Section style={contentSection}>{children}</Section>
          <Section style={footerSection}>
            <Text style={footerText}>
              Você está recebendo este email porque agendou um atendimento.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f6f6f4",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "32px 16px",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e8e6e1",
  borderRadius: 12,
  maxWidth: 560,
  margin: "0 auto",
  overflow: "hidden",
};

const headerSection: React.CSSProperties = {
  padding: "28px 28px 8px",
};

const headingStyle: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: 22,
  fontWeight: 600,
  lineHeight: 1.2,
  margin: 0,
};

const contentSection: React.CSSProperties = {
  padding: "8px 28px 28px",
  color: "#1a1a1a",
  fontSize: 15,
  lineHeight: 1.55,
};

const footerSection: React.CSSProperties = {
  borderTop: "1px solid #eeece6",
  padding: "16px 28px",
  backgroundColor: "#fafaf7",
};

const footerText: React.CSSProperties = {
  color: "#7a7a72",
  fontSize: 12,
  margin: 0,
};

// ── Pequenos blocos reutilizáveis ────────────────────────────────────────────

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ margin: "6px 0", fontSize: 14 }}>
      <span style={{ color: "#7a7a72" }}>{label}:</span>{" "}
      <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{value}</span>
    </Text>
  );
}

export function Cta({ href, label }: { href: string; label: string }) {
  return (
    <Text style={{ margin: "20px 0 0" }}>
      <a href={href} style={ctaStyle}>
        {label}
      </a>
    </Text>
  );
}

const ctaStyle: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  border: "none",
  borderRadius: 8,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};
