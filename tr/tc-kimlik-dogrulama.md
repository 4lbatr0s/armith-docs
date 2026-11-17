---
title: "T.C. kimlik numarası sağlama (checksum) nasıl çalışır"
description: "T.C. kimlik numarasının iki kontrol hanesi: formül, çalışılmış örnek ve kod. Geçerli sonuç numaranın biçiminin doğru olduğunu gösterir, bir kişiye ait olduğunu kanıtlamaz."
---

# T.C. kimlik numarası sağlama (checksum) nasıl çalışır

::: warning Taslak çeviri
Bu sayfa makine çevirisidir ve ana dili Türkçe olan biri gözden geçirmedi.
:::

T.C. kimlik numarası 11 haneden oluşur. Son iki hane kontrol hanesidir. Yanlış yazılmış veya uydurulmuş bir numarayı hiçbir servisi çağırmadan elemenizi sağlar.

## Kurallar
Haneleri d1'den d11'e yazın.

1. Numara tam 11 hanelidir.
2. d1 sıfır olamaz.
3. d10 = ((d1 + d3 + d5 + d7 + d9) × 7 − (d2 + d4 + d6 + d8)) mod 10
4. d11 = (d1 + d2 + … + d10) mod 10

3. kuralda fark negatif çıkabilir: sonuç her zaman 0 ile 9 arasında olacak şekilde matematiksel kalanı alın.

## Çalışılmış örnek
`10000000146` numarasını alın.

- Tek sıralı haneler: 1 + 0 + 0 + 0 + 1 = 2
- Çift sıralı haneler: 0
- d10 = (2 × 7 − 0) mod 10 = **4** (10. hane ile aynı)
- İlk on hanenin toplamı = 6, d11 = 6 mod 10 = **6** (11. hane ile aynı)

## Geçmek ne anlama gelir
Geçmek, numaranın **biçiminin doğru** olduğu anlamına gelir. Rastgele 11 haneli sayıların yaklaşık yüzde biri bu kontrolü geçer; yani bu bir yazım hatası filtresidir, kimlik kanıtı değildir. Numaranın gerçekten bir kişiye verildiğini yalnızca düzenleyen kurum doğrulayabilir. Armith bu kontrolü bir politika sinyali olarak kullanır (`idNumberValid`); Türkiye profilleri kontrolü geçemeyen numarayı reddeder. Ayrıntılar: [Türkiye kurulum rehberi](/tr/turkiye-kurulum).
