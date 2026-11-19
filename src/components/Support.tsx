import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface SupportProps {
  onClose: () => void
}

type Channel = 'wechat' | 'alipay'

export function Support({ onClose }: SupportProps) {
  const [channel, setChannel] = useState<Channel>('wechat')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="support-layer" role="dialog" aria-modal="true" aria-label="支持开发">
      <div className="support-card">
        <div className="support-head">
          <div>
            <span className="eyebrow">支持开发</span>
            <h2>请作者喝杯咖啡</h2>
            <p>如果 Aurora TV 帮到了你，可以扫码赞赏。完全自愿，不影响任何功能。</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="support-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={channel === 'wechat'}
            className={`support-tab ${channel === 'wechat' ? 'is-active' : ''}`}
            onClick={() => setChannel('wechat')}
          >
            微信
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={channel === 'alipay'}
            className={`support-tab ${channel === 'alipay' ? 'is-active' : ''}`}
            onClick={() => setChannel('alipay')}
          >
            支付宝
          </button>
        </div>

        <div className="support-qr">
          <img
            src={channel === 'wechat' ? '/donate/wechat.png' : '/donate/alipay.png'}
            alt={channel === 'wechat' ? '微信赞赏码' : '支付宝收款码'}
            draggable={false}
          />
          <p>
            {channel === 'wechat'
              ? '打开微信「扫一扫」，或用另一台手机扫描'
              : '打开支付宝「扫一扫」，或用另一台手机扫描'}
          </p>
        </div>

        <div className="support-foot">
          <span>感谢每一位支持者 ❤️</span>
          <button type="button" className="btn ghost" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
