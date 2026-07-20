#!/usr/bin/env python3
"""Canonical Fawzy Elkababgy menu from PDF (deduped, EN+AR)."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def slugify(text: str) -> str:
  s = unicodedata.normalize("NFKD", text)
  s = "".join(ch for ch in s if not unicodedata.combining(ch))
  s = s.lower().strip()
  s = s.replace("¼", "1-4").replace("⅓", "1-3").replace("½", "1-2")
  s = s.replace("(", " ").replace(")", " ")
  s = re.sub(r"[^a-z0-9]+", "-", s)
  return s.strip("-")[:80]


def money(n: float) -> tuple[str, str]:
  if float(n).is_integer():
    en = f"{int(n)} EGP"
    ar = f"{int(n)} ج.م"
  else:
    en = f"{n:.2f} EGP"
    ar = f"{n:.2f} ج.م"
  return en, ar


def item(
  name_en: str,
  name_ar: str,
  price: float,
  *,
  description_en: str = "",
  description_ar: str = "",
  image_hint: str = "",
) -> dict:
  pe, pa = money(price)
  slug = slugify(name_en)
  return {
    "slug": slug,
    "name_en": name_en,
    "name_ar": name_ar,
    "description_en": description_en,
    "description_ar": description_ar,
    "price_en": pe,
    "price_ar": pa,
    "image_url": f"images/menu/{slug}.jpg",
    "image_hint": image_hint or name_en,
  }


CATEGORIES: list[dict] = [
  {
    "slug": "sides",
    "name_en": "SIDE DISHES",
    "name_ar": "الأطباق الجانبية",
    "sort_order": 1,
    "products": [
      item("Rice with Vermicelli", "أرز بالشعرية", 62, image_hint="Egyptian rice with vermicelli in a bowl"),
      item("Plain Mixed Rice", "أرز بالخلطة ساده", 65, image_hint="Egyptian khalta mixed rice plain"),
      item(
        "Mixed Rice with Nuts and Liver",
        "أرز بالخلطة مكسرات + كبده",
        90,
        image_hint="Egyptian mixed rice with nuts and liver",
      ),
      item("White Rice", "أرز ابيض", 62, image_hint="bowl of plain white rice"),
      item("Basmati Rice", "أرز بسمتى", 65, image_hint="fragrant basmati rice plate"),
      item("Spaghetti Red Sauce", "مكرونة اسباجتى صوص أحمر", 105, image_hint="spaghetti with tomato sauce"),
      item("Pasta White Sauce", "مكرونة وايت صوص", 145, image_hint="creamy white sauce pasta"),
      item("Pasta Bolognese", "مكرونة صوص بولونيز", 205, image_hint="pasta bolognese meat sauce"),
      item("Negresco Pasta", "مكرونة نجرسكو", 205, image_hint="Egyptian negresco creamy chicken pasta"),
      item("Oven Baked Pasta", "مكرونة فرن", 205, image_hint="Egyptian pasta bechamel oven baked"),
      item("French Fries", "بوم فريت", 65, image_hint="crispy french fries"),
      item("Sautéed Vegetables", "خضار سوتيه", 70, image_hint="sautéed mixed vegetables"),
      item("White Rice Bolognese", "أرز ابيض بولونيز", 160, image_hint="white rice topped with bolognese"),
      item("Plain Fattah", "فتة سادة", 115, image_hint="Egyptian plain fattah with crispy bread and rice"),
    ],
  },
  {
    "slug": "mains",
    "name_en": "MAIN DISHES",
    "name_ar": "الأطباق الرئيسية",
    "sort_order": 2,
    "products": [
      item(
        "Escalope Pane with Rice or Potatoes",
        "إسكالوب بانية مع أرز أو بطاطس",
        550,
        image_hint="breaded escalope pane with fries",
      ),
      item(
        "Mushroom Piccata with Rice or Potatoes",
        "بيكاتا مشروم مع أرز أو بطاطس",
        550,
        image_hint="mushroom piccata chicken dish",
      ),
      item(
        "Chicken Pane with Rice or Potatoes",
        "فراخ بانية مع أرز أو بطاطس",
        400,
        image_hint="breaded chicken pane with fries",
      ),
      item(
        "Fillet au Poivre with Rice or Potatoes",
        "فيليه بوافر مع أرز أو بطاطس",
        540,
        image_hint="pepper steak fillet au poivre",
      ),
      item("Lamb Shank Fattah", "فتة موزة ضانى", 710, image_hint="Egyptian lamb shank fattah"),
      item(
        "Veal Shank with Vermicelli and Nuts",
        "موزة بتلو بالشعرية والمكسرات",
        725,
        image_hint="veal shank with vermicelli and nuts",
      ),
      item(
        "Lamb Shank Tanjia with Vegetable Basmati",
        "طنجية موزة ضانى + أرز بسمتى بالخضار",
        745,
        image_hint="Moroccan style lamb shank tanjia with vegetable rice",
      ),
      item(
        "Half Duck Orange Sauce with Red Rice",
        "½ بطة بصوص البرتقال مع أرز أحمر",
        540,
        image_hint="half roast duck with orange sauce and red rice",
      ),
    ],
  },
  {
    "slug": "royal",
    "name_en": "FAWZY ROYAL DISHES",
    "name_ar": "أطباق فوزي الملكية",
    "sort_order": 3,
    "products": [
      item("Royal Circassian", "الشركسية الملكية", 650, image_hint="Egyptian royal circassian chicken with nuts sauce"),
      item(
        "The Golden Pottery",
        "الفخارة الذهبية",
        700,
        description_en="Pigeon, grape leaves, and pigeon rice",
        description_ar="حمام + ورق عنب + أرز الحمام",
        image_hint="Egyptian stuffed pigeon with grape leaves in clay pot",
      ),
      item(
        "4G Kofta",
        "كفتة 4G",
        550,
        description_en="Kofta with sweet and sour sauce",
        description_ar="كفتة + صوص سويت أند ساور",
        image_hint="grilled kofta with sweet and sour sauce",
      ),
      item("Levantine Kofta", "الكفتة الشامية", 550, image_hint="Levantine shami style grilled kofta"),
      item(
        "The King's Crown",
        "تاج الملك",
        2850,
        description_en="Kofta, lamb kebab, tarb, sausage, lamb chops, and shish tawook",
        description_ar="كفتة + كباب ضاني + طرب + سجق + ريش ضاني + شيش طاووق",
        image_hint="huge Egyptian mixed grill platter feast on brass tray",
      ),
      item("Lamb Shoulder Zend", "زند ضاني", 2350, image_hint="large roasted lamb shoulder zend"),
      item(
        "The King's Grill",
        "شواية الملك",
        1200,
        description_en="Kebab, kofta, tawook, and sausage",
        description_ar="كباب + كفتة + طاووق + سجق",
        image_hint="Egyptian mixed grill kebab kofta tawook sausage",
      ),
    ],
  },
  {
    "slug": "soups",
    "name_en": "SOUPS",
    "name_ar": "الشوربة",
    "sort_order": 4,
    "products": [
      item("Fawzy Soup with Lamb Ribs", "شوربة فوزي (ريش ضاني)", 230, image_hint="Egyptian lamb ribs soup bowl"),
      item("Orzo Soup", "شوربة لسان عصفور", 70, image_hint="orzo bird tongue soup"),
      item("Cream of Chicken Soup", "شوربة فراخ بالكريمة", 85, image_hint="cream of chicken soup"),
      item("Cream of Mushroom Soup", "شوربة مشروم بالكريمة", 90, image_hint="cream of mushroom soup"),
      item("Pigeon Soup", "شوربة حمام", 65, image_hint="Egyptian pigeon soup"),
      item("Lentil Soup", "شوربة عدس", 80, image_hint="Egyptian lentil soup"),
      item("Knuckle Soup", "شوربة كوارع", 205, image_hint="Egyptian kaware3 knuckle soup"),
    ],
  },
  {
    "slug": "salads",
    "name_en": "SALADS",
    "name_ar": "السلطات",
    "sort_order": 5,
    "products": [
      item("Green Salad", "سلطة خضراء", 37, image_hint="fresh green salad"),
      item("Tahini", "طحينة", 37, image_hint="tahini dip bowl"),
      item("Baba Ganoush", "بابا غنوج", 37, image_hint="baba ganoush eggplant dip"),
      item("Cucumber Salad", "خيار", 37, image_hint="cucumber salad"),
      item("Eggplant Salad", "باذنجان", 37, image_hint="Egyptian eggplant salad"),
      item("Garlic Dip Toum", "ثومية", 45, image_hint="garlic toum dip"),
      item("Yogurt Salad", "زبادي", 45, image_hint="yogurt salad"),
      item("Marinated Tomatoes", "طماطم متبلة", 37, image_hint="marinated tomato salad"),
      item("Coleslaw", "كول سلو", 45, image_hint="coleslaw salad"),
      item("Mixed Sliced Salads", "ميكس سلاط شرائح", 75, image_hint="mixed sliced Middle Eastern salads platter"),
      item("Pickles", "مخلل", 37, image_hint="Egyptian mixed pickles"),
      item("Spicy Potatoes", "بطاطس حارة", 45, image_hint="spicy batata harra potatoes"),
      item("Beetroot Salad", "سلطة بنجر", 45, image_hint="beetroot salad"),
      item("Spicy Cheese", "جبنه حارة", 45, image_hint="spicy cheese appetizer"),
      item("Chicken Caesar Salad", "سيزار سلاط بالفراخ", 145, image_hint="chicken caesar salad"),
      item("Arugula with Mushrooms", "جرجير بالمشروم", 105, image_hint="arugula mushroom salad"),
      item("Fattoush", "فتوش", 95, image_hint="Lebanese fattoush salad"),
    ],
  },
  {
    "slug": "appetizers",
    "name_en": "APPETIZERS",
    "name_ar": "المقبلات",
    "sort_order": 6,
    "products": [
      item(
        "Fawzy Appetizers Mixed Stuffed",
        "مقبلات فوزى (محشى مشكل)",
        405,
        description_en="Cheese sambousek, meat sambousek, mombar, and sausage",
        description_ar="سمبوسك جبنه + سمبوسك باللحم + ممبار + سجق",
        image_hint="Egyptian mixed appetizer platter sambousek mombar sausage",
      ),
      item("Mixed Stuffed Vegetables", "محشى مشكل", 95, image_hint="Egyptian mixed mahshi stuffed vegetables"),
      item("Stuffed Grape Leaves", "محشى ورق عنب", 95, image_hint="stuffed grape leaves warak enab"),
      item("Stuffed Cabbage", "محشى كرنب", 95, image_hint="Egyptian stuffed cabbage mahshi"),
      item("Meat Sambousek 4 Pieces", "سمبوسك باللحمة 4 قطع", 84, image_hint="meat sambousek fried pastries"),
      item("Cheese Sambousek 4 Pieces", "سمبوسك بالجبنة 4 قطع", 84, image_hint="cheese sambousek fried pastries"),
      item("Mombar", "ممبار", 105, image_hint="Egyptian mombar stuffed intestines grilled"),
      item(
        "Sausage with Pomegranate Molasses",
        "سجق دبس الرمان",
        320,
        image_hint="Egyptian sausage with pomegranate molasses",
      ),
      item("Roqaq with Minced Meat", "رقاق باللحمة المفرومة", 220, image_hint="Egyptian roqaq pastry with minced meat"),
      item("Bread Basket", "سلة خبز", 30, image_hint="Middle Eastern bread basket pita baladi"),
    ],
  },
  {
    "slug": "grill-plates",
    "name_en": "GRILL PLATES",
    "name_ar": "جريل",
    "sort_order": 7,
    "products": [
      item("Meat Parcel", "ورقة لحمة", 440, image_hint="Egyptian waraet lahma meat parchment foil grill"),
      item("Liver Parcel", "ورقة كبدة", 400, image_hint="Egyptian grilled liver parchment parcel"),
      item("Sausage Parcel", "ورقة سجق", 380, image_hint="Egyptian sausage parchment grill parcel"),
      item(
        "Grilled Liver and Kidneys Parcel",
        "ورقة كبده وكلاوى جريل",
        370,
        image_hint="grilled liver and kidneys foil parcel",
      ),
      item("Grilled Offal Parcel", "ورقة مخاصى جريل", 370, image_hint="Egyptian grilled offal parcel"),
      item("Chicken Fajita", "فاهيتا فراخ", 350, image_hint="chicken fajita sizzling plate"),
      item(
        "Sausage Fried with Lamb Fat",
        "سجق محمر بالليه",
        350,
        image_hint="Egyptian sausage fried in lamb fat",
      ),
      item(
        "Liver Fried with Lamb Fat",
        "كبده محمره بالليه",
        350,
        image_hint="Egyptian liver fried in lamb fat",
      ),
      item(
        "Fawzy Grill Parcel",
        "ورقة فوزى جريل",
        380,
        description_en="Kidneys, liver, and offal",
        description_ar="كلاوى + كبدة + مخاصى",
        image_hint="Egyptian mixed offal grill foil parcel",
      ),
    ],
  },
  {
    "slug": "sandwiches",
    "name_en": "SANDWICHES",
    "name_ar": "السندوتشات",
    "sort_order": 8,
    "products": [
      item("Kofta Sandwich", "سندوتش كفتة", 150, image_hint="Egyptian kofta sandwich in baladi bread"),
      item("Tarb Sandwich", "سندوتش طرب", 200, image_hint="Egyptian tarb sandwich"),
      item("Veal Kebab Sandwich", "سندوتش كباب بتلو", 200, image_hint="veal kebab sandwich"),
      item("Lamb Kebab Sandwich", "سندوتش كباب ضانى", 200, image_hint="lamb kebab sandwich"),
      item("Sausage Sandwich", "سندوتش سجق", 150, image_hint="Egyptian sausage sandwich"),
      item("Tawook Sandwich", "سندوتش طاووق", 98, image_hint="shish tawook chicken sandwich"),
      item("Grilled Breast Sandwich", "سندوتش صدور مشوية", 100, image_hint="grilled chicken breast sandwich"),
      item("Burger", "برجر", 123, image_hint="beef burger sandwich"),
      item("Liver Sandwich", "سندوتش كبدة", 190, image_hint="Egyptian liver sandwich"),
    ],
  },
  {
    "slug": "desserts",
    "name_en": "DESSERTS",
    "name_ar": "الحلو",
    "sort_order": 9,
    "products": [
      item("Rice Pudding", "أرز باللبن", 65, image_hint="Egyptian rice pudding roz bel laban"),
      item("Om Ali", "أم على", 85, image_hint="Egyptian om ali dessert pastry milk nuts"),
      item("Mahalabia", "مهلبية", 65, image_hint="mahalabia milk pudding"),
      item("Crème Caramel", "كريم كراميل", 65, image_hint="creme caramel flan"),
      item("Fruit Salad", "فروت سلاط", 85, image_hint="fresh fruit salad bowl"),
      item(
        "Ice Cream",
        "ايس كريم",
        90,
        description_en="Mango, strawberry vanilla, or chocolate",
        description_ar="مانجو - فراولة فانيليا - شيكولاتة",
        image_hint="scoops of ice cream mango strawberry chocolate",
      ),
    ],
  },
  {
    "slug": "tajines",
    "name_en": "TAJINES",
    "name_ar": "الطواجن",
    "sort_order": 10,
    "products": [
      item("Tajine Meat with Onions", "طاجن لحمة بالبصل", 310, image_hint="Egyptian clay tajine meat with onions"),
      item("Tajine Potatoes with Meat", "طاجن بطاطس باللحمة", 310, image_hint="tajine potatoes with meat"),
      item("Tajine Peas with Meat", "طاجن بسله باللحمة", 310, image_hint="tajine green peas with meat"),
      item("Tajine Zucchini Bechamel", "طاجن كوسة بالبشامل", 220, image_hint="zucchini bechamel tajine"),
      item("Tajine Freekeh with Pigeon", "طاجن فريك بالحمام", 390, image_hint="freekeh tajine with pigeon"),
      item("Plain Stuffed Rice Tajine", "طاجن أرز معمر سادة", 130, image_hint="plain Egyptian stuffed rice tajine"),
      item("Plain Molokhia Tajine", "طاجن ملوخية سادة", 120, image_hint="plain molokhia green soup tajine"),
      item("Plain Moussaka Tajine", "طاجن مسقعة سادة", 120, image_hint="plain Egyptian moussaka tajine"),
      item("Tajine Okra with Lamb", "طاجن بامية باللحمة الضانى", 310, image_hint="okra bamia tajine with lamb"),
      item("Tajine Mixed Vegetables with Meat", "طاجن خضار مشكل باللحمة", 310, image_hint="mixed vegetable meat tajine"),
      item(
        "Tajine Green Beans with Meat",
        "طاجن فاصوليا خضراء باللحمة",
        310,
        image_hint="green beans fasolia tajine with meat",
      ),
      item("Tajine Stuffed Rice with Pigeon", "طاجن أرز معمر بالحمام", 410, image_hint="stuffed rice with pigeon tajine"),
      item("Tajine Fattah Kaware", "طاجن فتة كوارع", 550, image_hint="Egyptian fattah with kaware knuckle tajine"),
      item("Plain Peas Tajine", "طاجن بسله سادة", 120, image_hint="plain green peas tajine"),
      item("Plain Mixed Vegetables Tajine", "طاجن خضار سادة", 120, image_hint="plain mixed vegetables tajine"),
      item("Plain Potatoes Tajine", "طاجن بطاطس ساده", 120, image_hint="plain potato tajine"),
    ],
  },
  {
    "slug": "hot-drinks",
    "name_en": "HOT DRINKS",
    "name_ar": "المشروبات الساخنة",
    "sort_order": 11,
    "products": [
      item("Tea", "شاى", 42, image_hint="Egyptian tea glass"),
      item("Tea Pot", "براد شاى", 75, image_hint="teapot of tea"),
      item("Turkish Coffee", "قهوة تركى", 50, image_hint="Turkish coffee cup"),
      item("French Coffee", "قهوة فرنساوى", 60, image_hint="French coffee cup"),
      item("Herbal Tea", "اعشاب", 40, image_hint="herbal tea cup"),
      item("Espresso", "اسبرسو", 75, image_hint="espresso shot"),
      item(
        "Cappuccino",
        "كابتشينو",
        80,
        description_en="Hazelnut, caramel, or vanilla",
        description_ar="بندق / كراميل / فانيليا",
        image_hint="cappuccino coffee cup foam art",
      ),
      item("Mocha Coffee", "موكا كافيه", 80, image_hint="mocha coffee cup"),
      item("Nescafe", "نسكافيه", 65, image_hint="nescafe instant coffee cup"),
      item("Hot Chocolate", "هوت شوكلت", 70, image_hint="hot chocolate mug"),
      item("Latte", "لاتيه", 70, image_hint="cafe latte cup"),
    ],
  },
  {
    "slug": "cold-drinks",
    "name_en": "COLD DRINKS",
    "name_ar": "المشروبات الباردة",
    "sort_order": 12,
    "products": [
      item("Small Mineral Water", "مياه معدنيه صغيره", 28, image_hint="small bottled mineral water"),
      item("Soft Drink Can", "كانز", 41, image_hint="soft drink soda can"),
      item("Cola / Diet Cola", "كولا - كولا دايت", 41, image_hint="cola soft drink glass"),
      item("Sprite / Pineapple", "اسبريت - اناناس", 41, image_hint="sprite pineapple soda glass"),
      item("Mango Juice", "عصير مانجو", 75, image_hint="fresh mango juice glass"),
      item("Guava Juice", "عصير جوافة", 69, image_hint="fresh guava juice glass"),
      item("Strawberry Juice", "عصير فراولة", 69, image_hint="fresh strawberry juice"),
      item("Orange Juice", "عصير برتقال", 69, image_hint="fresh orange juice"),
      item("Lemon Juice", "عصير ليمون", 69, image_hint="fresh lemon juice"),
      item("Lemon Mint Juice", "عصير ليمون و نعناع", 69, image_hint="lemon mint juice"),
      item("Oreo Shake", "اوريو تشيك", 89, image_hint="oreo milkshake"),
      item("Iced Chocolate", "ايس شوكلت", 75, image_hint="iced chocolate drink"),
      item("Sunshine", "صن شاين", 74, image_hint="tropical sunshine cocktail mocktail"),
      item("Cherry Cola", "شيرى كولا", 65, image_hint="cherry cola drink"),
      item(
        "Smoothie",
        "سموزى",
        80,
        description_en="Mango, strawberry, or berries",
        description_ar="مانجو / فراولة / توت",
        image_hint="fruit smoothie glass",
      ),
      item(
        "Berry Mix",
        "ميكس توت",
        80,
        description_en="Peach, lemon, or mint",
        description_ar="خوخ / ليمون / نعناع",
        image_hint="berry mix iced drink",
      ),
      item(
        "Milkshake",
        "ميلك تشيك",
        80,
        description_en="Mango, strawberry, vanilla, or chocolate",
        description_ar="مانجو / فراولة / فانيليا / شيكولاته",
        image_hint="classic milkshake with whipped cream",
      ),
    ],
  },
]


def weight_products() -> list[dict]:
  """مشويات with separate ¼ / ⅓ / 1kg products where priced."""
  rows = [
    # name_en base, name_ar base, q_price, t_price, k_price, hint
    ("Kofta", "كفتة", 297.50, 446.25, 1190.00, "Egyptian charcoal grilled kofta skewers"),
    ("Tarb", "طرب", 297.50, 446.25, 1190.00, "Egyptian tarb fat wrapped kofta"),
    ("Veal Kebab", "كباب بتلو", 395.00, 592.50, 1580.00, "veal kebab charcoal skewers"),
    ("Veal Ribs", "ريش بتلو", None, 630.50, 1680.00, "grilled veal ribs"),
    ("Veal Liver", "كبده بتلو", 375.00, 562.50, 1500.00, "grilled veal liver"),
    ("Lamb Kebab", "كباب ضانى", 395.00, 592.50, 1580.00, "lamb kebab charcoal skewers"),
    ("Lamb Kebab and Kofta", "كباب و كفتة ضانى", 346.25, 520.50, 1385.00, "lamb kebab and kofta mix"),
    ("Veal Kebab and Kofta", "كباب و كفتة بتلو", 346.25, 520.50, 1385.00, "veal kebab and kofta mix"),
    ("Lamb Ribs", "ريش ضانى", 420.00, 630.50, 1680.00, "grilled lamb chops ribs"),
    ("Lamb Fillet", "فلتو ضانى", 420.00, 630.50, 1680.00, "grilled lamb fillet"),
    ("Sausage", "سجق", 297.50, 446.25, 1190.00, "Egyptian grilled sausage"),
    ("Beef Fillet Kandooz", "فيلية كندوز", None, 562.00, 1500.00, "grilled beef fillet kandooz"),
    ("Shish Tawook", "شيش طاووق", 190.00, 285.00, 760.00, "shish tawook chicken skewers"),
    ("Grilled Chicken Breasts", "صدور مشوية", 195.00, 292.75, 780.00, "grilled chicken breasts"),
  ]
  singles = [
    ("Grilled Lamb Shank", "موزة ضانى مشوية", 600.00, "grilled lamb shank"),
    ("Grilled Veal Shank", "موزة بتلو مشوية", 620.00, "grilled veal shank"),
    ("Grilled Whole Chicken", "فرخة مشوية", 380.00, "whole grilled chicken"),
    ("Boneless Grilled Chicken", "فرخة مخلية", 460.00, "boneless grilled chicken"),
    ("Shish Grilled Chicken", "فرخة شيش", 380.00, "shish style grilled chicken"),
    ("Hawawshi", "حواوشي", 170.00, "Egyptian hawawshi meat stuffed bread"),
    ("Pair of Quails", "جوز سمان", 320.00, "grilled pair of quails"),
    (
      "Stuffed Pigeon Rice or Freekeh",
      "فرد حمام محشى (أرز - فريك)",
      230.00,
      "Egyptian stuffed pigeon with rice or freekeh",
    ),
  ]
  products: list[dict] = []
  sizes = [
    ("¼ kg", "ربع كيلو", "quarter"),
    ("⅓ kg", "ثلث كيلو", "third"),
    ("1 kg", "كيلو", "kilo"),
  ]
  for name_en, name_ar, q, t, k, hint in rows:
    prices = [q, t, k]
    base_slug = slugify(name_en)
    shared_image = f"images/menu/{base_slug}.jpg"
    for (en_sz, ar_sz, key), price in zip(sizes, prices):
      if price is None:
        continue
      pe, pa = money(price)
      full_en = f"{name_en} ({en_sz})"
      products.append(
        {
          "slug": slugify(full_en),
          "name_en": full_en,
          "name_ar": f"{name_ar} ({ar_sz})",
          "description_en": "",
          "description_ar": "",
          "price_en": pe,
          "price_ar": pa,
          "image_url": shared_image,
          "image_hint": hint,
        }
      )
  for name_en, name_ar, price, hint in singles:
    products.append(item(name_en, name_ar, price, image_hint=hint))
  return products


CATEGORIES.append(
  {
    "slug": "grills",
    "name_en": "GRILLS",
    "name_ar": "المشويات",
    "sort_order": 13,
    "products": weight_products(),
  }
)


def validate() -> None:
  cat_slugs = set()
  product_keys = set()
  for cat in CATEGORIES:
    assert cat["slug"] not in cat_slugs, cat["slug"]
    cat_slugs.add(cat["slug"])
    for i, p in enumerate(cat["products"], start=1):
      p["sort_order"] = i
      key = (cat["slug"], p["name_en"])
      assert key not in product_keys, key
      product_keys.add(key)


def sql_literal(value: str | None) -> str:
  if value is None:
    return "null"
  return "'" + value.replace("'", "''") + "'"


def build_sql() -> str:
  validate()
  lines = [
    "-- Replace sample menu with full PDF menu (EN+AR, deduped)",
    "-- Soft-delete existing categories/products and insert new catalog",
    "",
    "update public.products",
    "set is_deleted = true, is_active = false, updated_at = now()",
    "where is_deleted = false;",
    "",
    "update public.categories",
    "set",
    "  slug = slug || '_archived_' || replace(id::text, '-', ''),",
    "  is_deleted = true,",
    "  is_active = false,",
    "  updated_at = now()",
    "where is_deleted = false;",
    "",
  ]

  cat_values = []
  for c in CATEGORIES:
    cat_values.append(
      f"  ({sql_literal(c['slug'])}, {sql_literal(c['name_en'])}, "
      f"{sql_literal(c['name_ar'])}, {c['sort_order']})"
    )
  lines.append("insert into public.categories (slug, name_en, name_ar, sort_order) values")
  lines.append(",\n".join(cat_values) + ";")
  lines.append("")

  lines.append(
    """insert into public.products (
  category_id,
  name_en,
  name_ar,
  description_en,
  description_ar,
  price_en,
  price_ar,
  image_url,
  badge_en,
  badge_ar,
  tags,
  sort_order,
  is_signature,
  signature_sort_order
)
select
  c.id,
  v.name_en,
  v.name_ar,
  v.description_en,
  v.description_ar,
  v.price_en,
  v.price_ar,
  v.image_url,
  v.badge_en,
  v.badge_ar,
  '[]'::jsonb,
  v.sort_order,
  v.is_signature,
  v.signature_sort_order
from (
  values"""
  )

  value_rows = []
  signature_names = {
    "The King's Crown",
    "The King's Grill",
    "Lamb Ribs (1 kg)",
    "Kofta (1 kg)",
    "Shish Tawook (1 kg)",
  }
  sig_i = 0
  for c in CATEGORIES:
    for p in c["products"]:
      is_sig = p["name_en"] in signature_names
      if is_sig:
        sig_i += 1
        sig_order = sig_i
      else:
        sig_order = 0
      value_rows.append(
        "    ("
        f"{sql_literal(c['slug'])}, "
        f"{sql_literal(p['name_en'])}, "
        f"{sql_literal(p['name_ar'])}, "
        f"{sql_literal(p['description_en'])}, "
        f"{sql_literal(p['description_ar'])}, "
        f"{sql_literal(p['price_en'])}, "
        f"{sql_literal(p['price_ar'])}, "
        f"{sql_literal(p['image_url'])}, "
        "null, null, "
        f"{p['sort_order']}, "
        f"{'true' if is_sig else 'false'}, "
        f"{sig_order}"
        ")"
      )
  lines.append(",\n".join(value_rows))
  lines.append(
    """  ) as v(
  slug,
  name_en,
  name_ar,
  description_en,
  description_ar,
  price_en,
  price_ar,
  image_url,
  badge_en,
  badge_ar,
  sort_order,
  is_signature,
  signature_sort_order
)
join public.categories c
  on c.slug = v.slug
 and c.is_deleted = false;"""
  )
  return "\n".join(lines) + "\n"


def main() -> None:
  validate()
  out_json = ROOT / "scripts" / "menu_catalog.json"
  out_sql = ROOT / "supabase" / "migrations" / "20260720140000_replace_menu_from_pdf.sql"
  payload = {
    "categories": CATEGORIES,
    "counts": {
      "categories": len(CATEGORIES),
      "products": sum(len(c["products"]) for c in CATEGORIES),
    },
  }
  out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
  out_sql.write_text(build_sql(), encoding="utf-8")
  print(json.dumps(payload["counts"], indent=2))
  print("wrote", out_json)
  print("wrote", out_sql)


if __name__ == "__main__":
  main()
