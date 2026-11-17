# Hızlı başlangıç (Türkçe)

::: warning Taslak çeviri
Makine çevirisidir ve gözden geçirilmedi. Tam ayrıntılar için [İngilizce hızlı başlangıç](/quickstart) sayfasına bakın.
:::

En kısa yol: barındırılan yakalama bağlantısı. Başvuran kimliğini ve selfie'sini bağlantı üzerinden çeker; siz sonucu API veya webhook ile alırsınız.

## 1. Sandbox anahtarı alın

Panelde **Entegrasyonlar > API anahtarları** bölümünden `ak_test_...` ile başlayan bir anahtar oluşturun. Sandbox ücretsizdir ve gerçek kişi verisi kullanmaz.

## 2. Doğrulama oluşturun

```bash
curl -X POST "$ARMITH_URL/kyc/profiles" \
  -H "x-api-key: ak_test_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationExternalRef": "siparis-1001",
    "returnUrl": "https://siteniz.example/dogrulama-bitti",
    "state": "siparis-1001",
    "countryCode": "TR",
    "workflowId": "tr-crypto"
  }'
```

`workflowId` isteğe bağlıdır: [düzenleme profillerinden](/advanced/policy-rules) birini seçtiyseniz adını yazın (`tr-payments`, `tr-crypto`, `eu-light`, `eu-strict`). Yanıttaki bağlantıyı başvurana gönderin. Panelden WhatsApp veya e-posta ile de gönderebilirsiniz (vaka menüsü).

## 3. Sonucu alın

- **Webhook:** `verification.completed` ve `verification.failed` olaylarına abone olun. İmzayı ham gövde ile doğrulayın ([@armith/node](https://github.com/4lbatr0s/armith/tree/main/sdks/node) içindeki `constructEvent`).
- **Sorgu:** `GET /kyc/status/{profileId}`.

## 4. Üretime geçin

1. `ak_live_...` anahtarı oluşturun ve yalnızca gereken yetkileri (`kyc:write`, `kyc:read`) verin.
2. Sabit IP'leriniz varsa IP izin listesi ekleyin.
3. Hukuki incelemeden geçmiş saklama süresini ve aydınlatma metnini ayarlayın.

Kod yazmadan kullanmak için n8n düğümü: `integrations/n8n` (Armith ve Armith Trigger).
