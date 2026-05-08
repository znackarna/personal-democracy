# Stripe setup checklist

Krok-za-krokem návod pro aktivaci podpory přes Stripe Payment Links. Bez backendu, bez API klíčů, bez webhooků — vše konfigurované v Stripe Dashboardu, do repa jen URLs do [`config/donations.yaml`](../config/donations.yaml).

## Předpoklady

- Stripe účet v aktivním režimu (mode = live, ne test). Při setupu si nejdřív vyzkoušejte vše v test módu — placeholder URLs ze stripe testu (`https://buy.stripe.com/test_*`) fungují identicky.
- Doménové ověření v Stripe → Settings → Apple Pay (volitelné, ale doporučené pro mobilní konverzi).
- Doplněné business údaje v Stripe Dashboard → Settings → Business: IČO, DIČ, kontaktní e-mail. Zobrazují se v automatických receiptech.

## 1. Vytvoření produktu

Stripe Dashboard → Products → Add product:

- **Name:** `Podpora projektu Czech Democracy Index` (nebo jakkoli; donor uvidí v Checkoutu a v e-mailu)
- **Description:** `Příspěvek na provoz projektu (LLM API, hosting, doména, lidská práce na metodice).`
- **Image (volitelné):** logo / screenshot z dashboardu, ~200×200 px
- **Tax behaviour:** *Inclusive* — pokud nejste plátce DPH, daň zatím neřešíme. Pokud plátce, nastavte podle účetní (typicky inclusive 21 % nebo zero-rated u darů; konzultovat).

Save product. Tento jeden produkt slouží pro všech 10 Payment Links níže — Stripe vám dovolí přidat libovolný počet **prices** (= variant) k jednomu produktu.

## 2. Vytvoření Prices (cen)

V detailu produktu → Pricing → Add another price. Vytvořte přesně tyto:

| ID v yaml | Currency | Amount | Billing | Použité v Payment Link pro |
|---|---|---|---|---|
| czk-100 | CZK | 100 | One-time | `czk.one_time[0]` |
| czk-500 | CZK | 500 | One-time | `czk.one_time[1]` |
| czk-1000 | CZK | 1 000 | One-time | `czk.one_time[2]` |
| czk-custom | CZK | *Customer chooses* | One-time | `czk.custom_url` |
| czk-100-month | CZK | 100 / month | Recurring → monthly | `czk.monthly[0]` |
| eur-5 | EUR | 5 | One-time | `eur.one_time[0]` |
| eur-20 | EUR | 20 | One-time | `eur.one_time[1]` |
| eur-50 | EUR | 50 | One-time | `eur.one_time[2]` |
| eur-custom | EUR | *Customer chooses* | One-time | `eur.custom_url` |
| eur-5-month | EUR | 5 / month | Recurring → monthly | `eur.monthly[0]` |

Pro `czk-custom` a `eur-custom`: typ ceny *"Customer chooses price"*. Stripe doporučí minimum (např. 50 Kč / 2 €) — to je rozumné, ať se nepleví poplatek vyšší než vlastní příspěvek.

## 3. Vytvoření Payment Linků

Pro každou cenu výše: Stripe Dashboard → Payment Links → New → Subscriptions and one-off payments → vyberte odpovídající cenu.

Pro každý link nastavte:

- **After payment:** *Show a confirmation page* → custom URL podle měny:
  - **CZK linky** (5 linků: 100, 500, 1000, custom, 100/měs) → `https://indexdemokracie.cz/dekuji/` (česká thank-you stránka)
  - **EUR linky** (5 linků: 5, 20, 50, custom, 5/měs) → `https://indexdemokracie.cz/en/thanks/` (anglická thank-you stránka)
  - Logika: měna ≈ jazyk dárce. EUR dárci dostanou anglickou stránku, CZK dárci českou. Není to striktní (CZ uživatel může poslat EUR), ale pro >95 % případů to sedí.
- **Collect customer addresses:** *Auto* (Stripe sám vyžádá podle země; doporučeno kvůli VAT compliance pro plátce).
- **Allow promotion codes:** Off (donations).
- **Customize phone number collection:** Off.
- **Adjustable quantity:** Off (donor mění částku přes "custom amount" link, ne přes množství).

**Recurring (monthly) linky navíc:**
- **Trial period:** None.
- **Customer portal:** Settings → Billing → Customer portal → Activate. To umožní dárcům si sami spravovat / pozastavit / zrušit pravidelné platby. Bez portálu vám budou psát maily.

Po vytvoření link uvidíte URL ve formátu `https://buy.stripe.com/abc123XYZ`. Pro test mód `https://buy.stripe.com/test_abc123XYZ`.

## 4. Vyplnění do `config/donations.yaml`

Otevřete [`config/donations.yaml`](../config/donations.yaml) a nahraďte všech 10 výskytů `PLACEHOLDER` reálnými URL podle mapování z kroku 2:

```yaml
links:
  czk:
    one_time:
      - amount: 100
        url: https://buy.stripe.com/abc123XYZ   # czk-100
      - amount: 500
        url: https://buy.stripe.com/...         # czk-500
      - amount: 1000
        url: https://buy.stripe.com/...         # czk-1000
    custom_url: https://buy.stripe.com/...      # czk-custom
    monthly:
      - amount: 100
        url: https://buy.stripe.com/...         # czk-100-month
  eur:
    # … obdobně
```

Commit + push. Vercel auto-deployne. Tlačítka na `/podpora/` a `/en/support/` se aktivují.

## 5. Test

1. V testovacím módu: na live webu klikněte na 100 Kč button → ověřte, že vás Stripe přesměruje na checkout, dokončete s test kartou `4242 4242 4242 4242`, exp `12/34`, CVC `123`. Po platbě Stripe redirect na `/dekuji/`.
2. V Stripe Dashboard → Payments uvidíte test transakci.
3. E-mail confirmation by měl dorazit do test inboxu (= e-mail uvedený při checkoutu).
4. Pro recurring: ověřte, že v Customer Portal lze předplatné zrušit.

Po úspěšném testu přepněte Stripe účet do live módu, vytvořte produkční Payment Linky stejným postupem (test linky nebudou v live fungovat) a aktualizujte yaml na live URL.

## 6. Update transparency čísel

Soubor [`config/donations.yaml`](../config/donations.yaml) obsahuje sekci `costs.monthly` s aktuálními měsíčními náklady. Aktualizujte čtvrtletně:

```yaml
costs:
  monthly:
    - id: api
      czk: 350      # zkontrolovat v Anthropic Console → Usage
    - id: hosting
      czk: 0
    - id: domain
      czk: 17       # ~200 Kč/year / 12 = 17 Kč/měs
total_monthly_czk: 367
```

Po update commit + push → web ukáže nová čísla.

## Co dělat, když...

- **Donor chce fakturu plnohodnotnou (nejen receipt):** odpovězte na potvrzovací e-mail — Stripe Receipt obsahuje vše potřebné, ale formálně není zdaňovacím dokladem. Standardní praxe: vystavte v účetnictví (Pohoda / Fakturoid) běžnou fakturu na základě data + částky z Stripe.
- **Donor zaplatil, ale nedorazil potvrzovací e-mail:** Stripe Dashboard → Customers → najít zákazníka → resend receipt. Často je problém antispam.
- **Donor chce zrušit recurring:** odkažte na Customer Portal link, který je v každém potvrzovacím e-mailu. Pokud nelze, ručně Stripe Dashboard → Subscriptions → Cancel.
- **VAT registrace:** pokud souhrnné platby přesáhnou 2 M Kč/12 měsíců, jste povinný plátce DPH. Konzultovat s účetní; pak nutné v Stripe nastavit Tax behaviour správně + vystavovat daňové doklady.

## Co NENÍ v tomto návodu

- **Webhooky.** Statický web nemá runtime endpoint, takže webhooky nepoužíváme. Pokud byste chtěli např. real-time "Right now we have 5 supporters" čítač na webu, je potřeba přidat Vercel Function pro `/api/stripe-webhook` a buď cache (Edge Config / KV), nebo přepnout web na ne-statický. Není to teď v plánu.
- **Stripe Tax pro automatické DPH.** Vyžaduje plátce DPH a aktivaci Stripe Tax v Settings → Tax. Standardní DPH 21 % se připočítá ke každé transakci.
- **Apple Pay verifikace domény.** Pro Apple Pay tlačítko v Checkoutu je potřeba ověřit doménu v Stripe → Settings → Payment methods → Apple Pay → Add domain. Bez toho funguje Google Pay i kartové platby normálně.
