# Türkiye için kurulum rehberi

::: warning Taslak çeviri ve taslak profil
Bu sayfa makine çevirisidir; ana dili Türkçe olan biri gözden geçirmedi. Profiller `confirm_with_counsel` durumundadır: MASAK, BDDK ve TCMB metinlerini ve lisans koşullarınızı hukuk danışmanınızla doğrulayın. Armith hukuki tavsiye vermez.
:::

## 1. Profilinizi seçin

| Profil | Kimler için | Adımlar |
|---|---|---|
| `tr-payments` | Ödeme ve elektronik para kuruluşları | Kimlik, selfie, tarama. NFC çipi tercih edilen kanıttır. |
| `tr-crypto` | Kripto varlık hizmet sağlayıcıları | Kimlik, selfie, görüntülü görüşme, tarama, insan incelemesi. |

İki profil de şu kuralları içerir:

- T.C. kimlik numarası sağlama (checksum) kontrolünden geçmezse başvuru reddedilir.
- Başvuran 18 yaşından küçükse veya belge süresi dolmuşsa başvuru reddedilir.
- Tarama sonucunda eşleşme varsa, risk puanı yüksekse, aynı fotoğraf başka bir vakada kullanıldıysa veya sahtecilik şüphesi varsa vaka insana yönlendirilir.
- NFC çipi okunmadıysa vaka insana yönlendirilir. Çip sahte çıkarsa başvuru reddedilir.

Kurallar bir sonucu yalnızca sıkılaştırabilir. Hiçbir kural bir başvuruyu kendi başına onaylamaz.

## 2. Profili uygulayın

1. Panelde **Politika > Profilden başla** bölümünü açın.
2. Profili seçin ve kaydedin.
3. Gerekmeyen kuralı kaldırın. Örnek: akışınızda NFC yoksa "Çip okunmadı" kuralını silin.

## 3. Başvurana bağlantı gönderin

Vaka menüsünden bağlantıyı WhatsApp veya e-posta ile gönderin. Başvuran bağlantıyı açar ve adımları tamamlar. Bağlantı geçersizse başvuran sizden yeni bağlantı ister.

## 4. Şimdilik bilinmesi gerekenler

- **Görüntülü görüşme** şu an beklemededir. Düzenleyiciniz canlı görüntülü kontrol istiyorsa `tr-crypto` profilindeki bu adım için Armith'e güvenmeyin.
- **NFC çip kontrolü** sunucu tarafında vardır. Gerçek bir kartla henüz sınanmadı ve vaka durumunu kendisi değiştirmez.
- **Ehliyet** ve eski tip kimlik için ayrı bir akış yoktur.
- **Saklama süresi** sizin kararınızdır. Mevzuattaki süreyi danışmanınızla doğrulayın.

Daha fazlası: [Armith size uygun mu?](/concepts/is-armith-right-for-you), [Politika kuralları](/advanced/policy-rules), [Denetim ve inceleme](/advanced/audit-and-review).
