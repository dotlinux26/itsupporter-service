import { useState } from 'react';
import styled from 'styled-components';
import { Copy, Check, Ticket, Sparkles } from 'lucide-react';

export interface VoucherCardProps {
  code: string;
  name?: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  status?: 'active' | 'used' | 'expired' | 'voided';
  validTo?: string | null;
  onApply?: (code: string) => void;
  compact?: boolean;
}

export function VoucherCard({
  code,
  name = 'VOUCHER ƯU ĐÃI',
  description = 'Áp dụng cho mọi dịch vụ IT Supporter',
  discountType,
  discountValue,
  status = 'active',
  validTo,
  onApply,
  compact = false,
}: VoucherCardProps) {
  const [copied, setCopied] = useState(false);

  const discountText =
    discountType === 'percent'
      ? discountValue === 100
        ? 'FREE 100%'
        : `-${discountValue}%`
      : `-${discountValue.toLocaleString('vi-VN')}đ`;

  const isUsed = status === 'used';
  const isExpired = status === 'expired';
  const isVoided = status === 'voided';
  const isInactive = isUsed || isExpired || isVoided;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <StyledTicketWrapper $isInactive={isInactive} $compact={compact}>
      <div className={`ticket-card ${isInactive ? 'inactive' : 'active'}`}>
        <div className="notes">IT SUPPORTER</div>
        <div className="notes">♪♪♪♪♪</div>

        {/* Header Section */}
        <div className="ticket-header">
          <div className="ticket-title flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Ticket className="w-5 h-5 text-orange-500" />
              <span>{discountText}</span>
            </span>
            <div className="cut-symbol">✁</div>
          </div>
          <p className="ticket-program-name">{name}</p>
        </div>

        {/* Body Section */}
        <div className="ticket-body">
          <p className="ticket-desc">{description}</p>
          {validTo && (
            <div className="ticket-validity">
              Hạn dùng: {new Date(validTo).toLocaleDateString('vi-VN')}
            </div>
          )}

          {/* Stamp overlay if used or expired */}
          {isUsed && (
            <div className="stamp used-stamp">
              ĐÃ SỬ DỤNG
            </div>
          )}
          {isExpired && (
            <div className="stamp expired-stamp">
              HẾT HẠN
            </div>
          )}
          {isVoided && (
            <div className="stamp voided-stamp">
              VÔ HIỆU
            </div>
          )}
        </div>

        {/* Footer Section with Barcode & Code */}
        <div className="ticket-footer">
          <div className="code-container flex items-center justify-between gap-2">
            <span className={`voucher-code-text ${isInactive ? 'line-through opacity-70' : ''}`}>
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="copy-btn"
              title="Sao chép mã"
              type="button"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
            </button>
          </div>

          {/* Stylized Barcode */}
          <div className="barcode-bars" />

          {onApply && !isInactive && (
            <button
              onClick={() => onApply(code)}
              className="apply-btn mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-sm"
              type="button"
            >
              <Sparkles className="w-3 h-3" />
              Áp dụng ngay
            </button>
          )}
        </div>

        {/* Holographic background layer */}
        <div className="bg-holographic" />
      </div>
    </StyledTicketWrapper>
  );
}

const StyledTicketWrapper = styled.div<{ $isInactive: boolean; $compact: boolean }>`
  display: inline-block;
  user-select: none;

  .ticket-card {
    --width: ${(props) => (props.$compact ? '220px' : '260px')};
    --height: ${(props) => (props.$compact ? '300px' : '340px')};
    --perforation-size: 10px;
    --cutouts-adjust: 60px;

    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 0.75rem;
    grid-template-areas:
      "header"
      "body"
      "footer";

    width: var(--width);
    height: var(--height);
    padding: 1rem 0.875rem;
    border-radius: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;

    ${(props) =>
      !props.$isInactive &&
      `
      &:hover {
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 12px 24px rgba(234, 88, 12, 0.12), 0 4px 8px rgba(0, 0, 0, 0.05);
      }
    `}

    ${(props) =>
      props.$isInactive &&
      `
      filter: grayscale(80%) opacity(0.85);
      background: #f8fafc;
    `}
  }

  .ticket-header {
    grid-area: header;
    position: relative;
    z-index: 2;
    border-bottom: 1px dashed rgba(203, 213, 225, 0.8);
    padding-bottom: 0.5rem;
  }

  .ticket-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: #ea580c;
    letter-spacing: -0.02em;
  }

  .ticket-program-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: #1e293b;
    margin-top: 0.25rem;
    line-height: 1.25;
  }

  .ticket-body {
    grid-area: body;
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .ticket-desc {
    font-size: 0.78rem;
    color: #64748b;
    line-height: 1.35;
  }

  .ticket-validity {
    margin-top: 0.5rem;
    font-size: 0.72rem;
    color: #94a3b8;
  }

  .stamp {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-18deg);
    padding: 0.25rem 0.75rem;
    font-size: 1.1rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    border-radius: 6px;
    z-index: 10;
    border: 3px solid;
    pointer-events: none;
    text-shadow: 1px 1px 0 #fff;
  }

  .used-stamp {
    color: #dc2626;
    border-color: #dc2626;
    background: rgba(254, 226, 226, 0.85);
  }

  .expired-stamp {
    color: #64748b;
    border-color: #64748b;
    background: rgba(241, 245, 249, 0.85);
  }

  .voided-stamp {
    color: #475569;
    border-color: #475569;
    background: rgba(226, 232, 240, 0.85);
  }

  .ticket-footer {
    grid-area: footer;
    position: relative;
    z-index: 2;
    border-top: 1px dashed rgba(203, 213, 225, 0.8);
    padding-top: 0.5rem;
  }

  .code-container {
    background: #f1f5f9;
    border-radius: 6px;
    padding: 0.35rem 0.5rem;
    margin-bottom: 0.5rem;
  }

  .voucher-code-text {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 0.88rem;
    color: #0f172a;
    letter-spacing: 0.05em;
  }

  .copy-btn {
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.2s;
    &:hover {
      background: #e2e8f0;
    }
  }

  .barcode-bars {
    width: 100%;
    height: 24px;
    margin: 0 auto;
    background-image: repeating-linear-gradient(
      90deg,
      #1e293b,
      #1e293b 2px,
      transparent 2px,
      transparent 4px,
      #1e293b 4px,
      #1e293b 7px,
      transparent 7px,
      transparent 9px,
      #1e293b 9px,
      #1e293b 10px,
      transparent 10px,
      transparent 13px
    );
    opacity: 0.75;
  }

  .cut-symbol {
    font-size: 1.15rem;
    color: #94a3b8;
    transform: rotate(90deg);
  }

  .notes {
    position: absolute;
    inset: 0;
    overflow: hidden;
    font-size: 2.2rem;
    font-weight: 900;
    color: #f1f5f9;
    letter-spacing: 0.1em;
    opacity: 0.35;
    pointer-events: none;
    transform: translateY(25%) rotate(-12deg);
    z-index: 1;
  }

  .bg-holographic {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: ${(props) => (props.$isInactive ? 0 : 0.08)};
    background: linear-gradient(
      135deg,
      rgba(255, 107, 254, 0.4) 0%,
      rgba(0, 249, 248, 0.4) 50%,
      rgba(254, 88, 12, 0.4) 100%
    );
    mix-blend-mode: overlay;
  }
`;
