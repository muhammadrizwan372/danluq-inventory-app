"""Seed demo data for Danluq Petro Industries."""
import requests
import sys

BASE = "http://localhost:8000/api"

def login():
    r = requests.post(f"{BASE}/auth/login", json={"email": "admin@danluq.com", "password": "1234"})
    r.raise_for_status()
    return {"Authorization": f"Bearer {r.json()['access_token']}"}

def seed():
    h = login()
    print("Logged in as admin")

    # --- Categories ---
    categories = [
        {"name": "Lubricants", "description": "Engine oils, greases, and lubricants"},
        {"name": "Fuel Products", "description": "Diesel, petrol, and kerosene"},
        {"name": "Industrial Chemicals", "description": "Solvents, additives, and chemicals"},
        {"name": "Equipment & Parts", "description": "Pumps, filters, and spare parts"},
        {"name": "Safety Gear", "description": "PPE, gloves, helmets, and safety equipment"},
    ]
    cat_ids = {}
    for c in categories:
        r = requests.post(f"{BASE}/categories", json=c, headers=h)
        if r.status_code == 201:
            cat_ids[c["name"]] = r.json()["id"]
            print(f"  Category: {c['name']}")
        else:
            print(f"  Category '{c['name']}' skipped (may exist)")

    # --- Products ---
    products = [
        {"name": "Premium Engine Oil 5W-30", "sku": "LUB-001", "description": "High-performance synthetic engine oil", "category_id": cat_ids.get("Lubricants"), "price": 45.00, "cost": 28.00, "stock_quantity": 150, "reorder_level": 30, "unit": "liters"},
        {"name": "Hydraulic Oil ISO 68", "sku": "LUB-002", "description": "Industrial hydraulic fluid", "category_id": cat_ids.get("Lubricants"), "price": 38.50, "cost": 22.00, "stock_quantity": 200, "reorder_level": 50, "unit": "liters"},
        {"name": "Multi-Purpose Grease", "sku": "LUB-003", "description": "Lithium-based grease for bearings", "category_id": cat_ids.get("Lubricants"), "price": 12.00, "cost": 6.50, "stock_quantity": 80, "reorder_level": 20, "unit": "kg"},
        {"name": "Gear Oil 80W-90", "sku": "LUB-004", "description": "Heavy-duty gear lubricant", "category_id": cat_ids.get("Lubricants"), "price": 52.00, "cost": 32.00, "stock_quantity": 5, "reorder_level": 25, "unit": "liters"},
        {"name": "AGO Diesel Fuel", "sku": "FUEL-001", "description": "Automotive Gas Oil (Diesel)", "category_id": cat_ids.get("Fuel Products"), "price": 1.20, "cost": 0.95, "stock_quantity": 5000, "reorder_level": 1000, "unit": "liters"},
        {"name": "Premium Motor Spirit", "sku": "FUEL-002", "description": "PMS (Petrol)", "category_id": cat_ids.get("Fuel Products"), "price": 1.10, "cost": 0.88, "stock_quantity": 3000, "reorder_level": 800, "unit": "liters"},
        {"name": "Kerosene (DPK)", "sku": "FUEL-003", "description": "Dual Purpose Kerosene", "category_id": cat_ids.get("Fuel Products"), "price": 0.95, "cost": 0.72, "stock_quantity": 2000, "reorder_level": 500, "unit": "liters"},
        {"name": "Industrial Solvent", "sku": "CHEM-001", "description": "Cleaning solvent for equipment", "category_id": cat_ids.get("Industrial Chemicals"), "price": 25.00, "cost": 15.00, "stock_quantity": 60, "reorder_level": 15, "unit": "liters"},
        {"name": "Fuel Additive Plus", "sku": "CHEM-002", "description": "Fuel performance enhancer", "category_id": cat_ids.get("Industrial Chemicals"), "price": 18.00, "cost": 9.50, "stock_quantity": 100, "reorder_level": 25, "unit": "bottles"},
        {"name": "Diesel Fuel Pump", "sku": "EQP-001", "description": "Heavy-duty fuel transfer pump", "category_id": cat_ids.get("Equipment & Parts"), "price": 350.00, "cost": 220.00, "stock_quantity": 8, "reorder_level": 3, "unit": "pcs"},
        {"name": "Oil Filter (Universal)", "sku": "EQP-002", "description": "Universal oil filter for engines", "category_id": cat_ids.get("Equipment & Parts"), "price": 15.00, "cost": 7.50, "stock_quantity": 3, "reorder_level": 20, "unit": "pcs"},
        {"name": "Fuel Hose 2-inch", "sku": "EQP-003", "description": "Flexible fuel hose, 2-inch diameter", "category_id": cat_ids.get("Equipment & Parts"), "price": 8.50, "cost": 4.20, "stock_quantity": 120, "reorder_level": 30, "unit": "meters"},
        {"name": "Safety Helmet", "sku": "SAF-001", "description": "Industrial safety helmet, ANSI approved", "category_id": cat_ids.get("Safety Gear"), "price": 22.00, "cost": 12.00, "stock_quantity": 25, "reorder_level": 10, "unit": "pcs"},
        {"name": "Chemical Resistant Gloves", "sku": "SAF-002", "description": "Nitrile gloves for chemical handling", "category_id": cat_ids.get("Safety Gear"), "price": 8.00, "cost": 3.50, "stock_quantity": 50, "reorder_level": 20, "unit": "pairs"},
        {"name": "Fire Extinguisher 5kg", "sku": "SAF-003", "description": "Dry powder fire extinguisher", "category_id": cat_ids.get("Safety Gear"), "price": 65.00, "cost": 38.00, "stock_quantity": 12, "reorder_level": 5, "unit": "pcs"},
    ]
    prod_ids = {}
    for p in products:
        r = requests.post(f"{BASE}/products", json=p, headers=h)
        if r.status_code == 201:
            prod_ids[p["sku"]] = r.json()["id"]
            print(f"  Product: {p['name']}")

    # --- Suppliers ---
    suppliers = [
        {"name": "PetroMax Distributors", "contact_person": "Ahmed Hassan", "email": "ahmed@petromax.com", "phone": "+234-801-234-5678", "address": "12 Industrial Estate", "city": "Lagos", "country": "Nigeria"},
        {"name": "Global Lubricants Ltd", "contact_person": "Fatima Yusuf", "email": "fatima@globallub.com", "phone": "+234-802-345-6789", "address": "45 Commerce Road", "city": "Port Harcourt", "country": "Nigeria"},
        {"name": "SafetyFirst Supplies", "contact_person": "John Okafor", "email": "john@safetyfirst.ng", "phone": "+234-803-456-7890", "address": "78 Market Street", "city": "Abuja", "country": "Nigeria"},
        {"name": "ChemTech Industries", "contact_person": "Musa Ibrahim", "email": "musa@chemtech.com", "phone": "+234-804-567-8901", "address": "22 Factory Lane", "city": "Kano", "country": "Nigeria"},
    ]
    sup_ids = {}
    for s in suppliers:
        r = requests.post(f"{BASE}/suppliers/", json=s, headers=h)
        if r.status_code == 201:
            sup_ids[s["name"]] = r.json()["id"]
            print(f"  Supplier: {s['name']}")

    # --- Customers ---
    customers = [
        {"name": "Niger Delta Construction Co.", "email": "procurement@ndcc.com", "phone": "+234-811-111-1111", "address": "5 Victoria Island", "city": "Lagos", "country": "Nigeria", "notes": "Large volume customer, monthly orders"},
        {"name": "Abuja Transport Services", "email": "fleet@abujatransport.ng", "phone": "+234-812-222-2222", "address": "14 Central Business District", "city": "Abuja", "country": "Nigeria", "notes": "Fleet management company"},
        {"name": "Kano Industrial Group", "email": "supplies@kanoindustrial.com", "phone": "+234-813-333-3333", "address": "88 Industrial Avenue", "city": "Kano", "country": "Nigeria"},
        {"name": "Dangote Farms Ltd", "email": "purchasing@dangotefarms.ng", "phone": "+234-814-444-4444", "address": "Plot 42 Agric Zone", "city": "Kaduna", "country": "Nigeria", "notes": "Agricultural equipment lubricants"},
        {"name": "Lagos Haulage Company", "email": "ops@lagoshaulage.com", "phone": "+234-815-555-5555", "address": "23 Apapa Wharf Road", "city": "Lagos", "country": "Nigeria"},
        {"name": "Zenith Generators", "email": "parts@zenithgen.com", "phone": "+234-816-666-6666", "address": "11 Power Station Road", "city": "Port Harcourt", "country": "Nigeria", "notes": "Generator maintenance supplies"},
    ]
    cust_ids = {}
    for c in customers:
        r = requests.post(f"{BASE}/customers/", json=c, headers=h)
        if r.status_code == 201:
            cust_ids[c["name"]] = r.json()["id"]
            print(f"  Customer: {c['name']}")

    # --- Orders ---
    orders = [
        {"customer_id": cust_ids.get("Niger Delta Construction Co."), "notes": "Urgent - construction site delivery", "tax": 7.5, "discount": 5.0,
         "items": [{"product_id": prod_ids.get("LUB-001"), "quantity": 20, "unit_price": 45.00}, {"product_id": prod_ids.get("LUB-003"), "quantity": 10, "unit_price": 12.00}]},
        {"customer_id": cust_ids.get("Abuja Transport Services"), "notes": "Monthly fleet supply", "tax": 7.5, "discount": 0,
         "items": [{"product_id": prod_ids.get("FUEL-001"), "quantity": 500, "unit_price": 1.20}, {"product_id": prod_ids.get("EQP-002"), "quantity": 5, "unit_price": 15.00}]},
        {"customer_id": cust_ids.get("Lagos Haulage Company"), "notes": "Haulage fleet maintenance", "tax": 7.5, "discount": 2.0,
         "items": [{"product_id": prod_ids.get("LUB-001"), "quantity": 50, "unit_price": 45.00}, {"product_id": prod_ids.get("LUB-002"), "quantity": 30, "unit_price": 38.50}]},
        {"customer_id": cust_ids.get("Zenith Generators"), "notes": "Generator maintenance order", "tax": 7.5, "discount": 0,
         "items": [{"product_id": prod_ids.get("LUB-001"), "quantity": 10, "unit_price": 45.00}, {"product_id": prod_ids.get("EQP-002"), "quantity": 8, "unit_price": 15.00}]},
        {"customer_id": cust_ids.get("Dangote Farms Ltd"), "notes": "Agricultural equipment lubricants", "tax": 7.5, "discount": 3.0,
         "items": [{"product_id": prod_ids.get("LUB-002"), "quantity": 40, "unit_price": 38.50}, {"product_id": prod_ids.get("LUB-003"), "quantity": 15, "unit_price": 12.00}]},
    ]
    order_ids = []
    for o in orders:
        if o["customer_id"] and all(item["product_id"] for item in o["items"]):
            r = requests.post(f"{BASE}/orders/", json=o, headers=h)
            if r.status_code == 201:
                oid = r.json()["id"]
                order_ids.append(oid)
                print(f"  Order: {r.json()['order_number']}")
                # Confirm first 3 orders
                if len(order_ids) <= 3:
                    requests.put(f"{BASE}/orders/{oid}", json={"status": "confirmed"}, headers=h)  # uses /api/orders/{id} which has no trailing slash issue

    # --- Purchase Orders ---
    pos = [
        {"supplier_id": sup_ids.get("PetroMax Distributors"), "notes": "Monthly fuel restock",
         "items": [{"product_id": prod_ids.get("FUEL-001"), "quantity": 2000, "unit_price": 0.95}, {"product_id": prod_ids.get("FUEL-002"), "quantity": 1500, "unit_price": 0.88}]},
        {"supplier_id": sup_ids.get("Global Lubricants Ltd"), "notes": "Lubricant inventory replenishment",
         "items": [{"product_id": prod_ids.get("LUB-001"), "quantity": 100, "unit_price": 28.00}, {"product_id": prod_ids.get("LUB-002"), "quantity": 80, "unit_price": 22.00}]},
        {"supplier_id": sup_ids.get("SafetyFirst Supplies"), "notes": "Safety equipment order",
         "items": [{"product_id": prod_ids.get("SAF-001"), "quantity": 20, "unit_price": 12.00}, {"product_id": prod_ids.get("SAF-002"), "quantity": 50, "unit_price": 3.50}]},
    ]
    for po in pos:
        if po["supplier_id"] and all(item["product_id"] for item in po["items"]):
            r = requests.post(f"{BASE}/purchase-orders/", json=po, headers=h)
            if r.status_code == 201:
                print(f"  PO: {r.json()['po_number']}")

    # --- Expenses ---
    expenses = [
        {"category": "rent", "description": "Warehouse rent - May 2025", "amount": 2500.00, "is_paid": True, "reference": "RENT-MAY25"},
        {"category": "utilities", "description": "Electricity bill - April 2025", "amount": 850.00, "is_paid": True, "reference": "ELEC-APR25"},
        {"category": "transport", "description": "Fuel delivery to Lagos depot", "amount": 1200.00, "is_paid": True, "reference": "TRANS-001"},
        {"category": "salaries", "description": "Staff salaries - April 2025", "amount": 8500.00, "is_paid": True, "reference": "SAL-APR25"},
        {"category": "maintenance", "description": "Pump repair and servicing", "amount": 450.00, "is_paid": False, "reference": "MAINT-001"},
        {"category": "supplies", "description": "Office stationery and supplies", "amount": 120.00, "is_paid": True, "reference": "OFF-001"},
        {"category": "insurance", "description": "Warehouse insurance premium Q2", "amount": 1800.00, "is_paid": False, "reference": "INS-Q2-25"},
        {"category": "marketing", "description": "Business cards and flyers printing", "amount": 350.00, "is_paid": True, "reference": "MKT-001"},
        {"category": "transport", "description": "Delivery truck fuel", "amount": 680.00, "is_paid": True, "reference": "TRANS-002"},
        {"category": "utilities", "description": "Internet service - May 2025", "amount": 150.00, "is_paid": False, "reference": "NET-MAY25"},
    ]
    for e in expenses:
        r = requests.post(f"{BASE}/expenses/", json=e, headers=h)
        if r.status_code in (200, 201):
            print(f"  Expense: {e['description']}")

    # --- Journal Entries (Transactions) ---
    # Get account IDs
    accts = requests.get(f"{BASE}/accounts/", headers=h).json()
    acct_map = {a["code"]: a["id"] for a in accts}

    txns = [
        {"description": "Initial capital investment", "entries": [
            {"account_id": acct_map.get("1100"), "debit": 50000.00, "credit": 0, "description": "Bank deposit"},
            {"account_id": acct_map.get("3000"), "debit": 0, "credit": 50000.00, "description": "Owner's capital"},
        ]},
        {"description": "Inventory purchase - lubricants", "entries": [
            {"account_id": acct_map.get("1300"), "debit": 8500.00, "credit": 0, "description": "Lubricant stock"},
            {"account_id": acct_map.get("1100"), "debit": 0, "credit": 8500.00, "description": "Bank payment"},
        ]},
        {"description": "Sales revenue - Niger Delta Construction", "entries": [
            {"account_id": acct_map.get("1200"), "debit": 5200.00, "credit": 0, "description": "Customer receivable"},
            {"account_id": acct_map.get("4000"), "debit": 0, "credit": 5200.00, "description": "Sales income"},
        ]},
        {"description": "Office rent payment", "entries": [
            {"account_id": acct_map.get("5200"), "debit": 2500.00, "credit": 0, "description": "Rent expense"},
            {"account_id": acct_map.get("1100"), "debit": 0, "credit": 2500.00, "description": "Bank payment"},
        ]},
        {"description": "Customer payment received", "entries": [
            {"account_id": acct_map.get("1100"), "debit": 3000.00, "credit": 0, "description": "Payment from customer"},
            {"account_id": acct_map.get("1200"), "debit": 0, "credit": 3000.00, "description": "Reduce receivable"},
        ]},
        {"description": "Utility bills payment", "entries": [
            {"account_id": acct_map.get("5300"), "debit": 850.00, "credit": 0, "description": "Electricity"},
            {"account_id": acct_map.get("1000"), "debit": 0, "credit": 850.00, "description": "Cash payment"},
        ]},
    ]
    txn_ids = []
    for t in txns:
        if all(e["account_id"] for e in t["entries"]):
            r = requests.post(f"{BASE}/transactions/", json=t, headers=h)
            if r.status_code in (200, 201):
                tid = r.json()["id"]
                txn_ids.append(tid)
                print(f"  Transaction: {t['description']}")

    # Post all transactions
    for tid in txn_ids:
        requests.put(f"{BASE}/transactions/{tid}", json={"status": "posted"}, headers=h)
    print(f"  Posted {len(txn_ids)} transactions")

    # --- Payables & Receivables ---
    prs = [
        {"type": "payable", "party_name": "PetroMax Distributors", "description": "Fuel supply invoice - May batch", "total_amount": 12500.00, "supplier_id": sup_ids.get("PetroMax Distributors")},
        {"type": "payable", "party_name": "Global Lubricants Ltd", "description": "Lubricant stock purchase", "total_amount": 4560.00, "supplier_id": sup_ids.get("Global Lubricants Ltd")},
        {"type": "receivable", "party_name": "Niger Delta Construction Co.", "description": "Order payment outstanding", "total_amount": 5200.00, "customer_id": cust_ids.get("Niger Delta Construction Co.")},
        {"type": "receivable", "party_name": "Abuja Transport Services", "description": "Fleet supply invoice", "total_amount": 3800.00, "customer_id": cust_ids.get("Abuja Transport Services")},
        {"type": "receivable", "party_name": "Lagos Haulage Company", "description": "Lubricant order balance", "total_amount": 7250.00, "customer_id": cust_ids.get("Lagos Haulage Company")},
    ]
    pr_ids = []
    for p in prs:
        r = requests.post(f"{BASE}/payables-receivables/", json=p, headers=h)
        if r.status_code in (200, 201):
            pr_ids.append(r.json()["id"])
            print(f"  {'AP' if p['type'] == 'payable' else 'AR'}: {p['party_name']}")

    # Record partial payments on some
    if len(pr_ids) >= 3:
        requests.put(f"{BASE}/payables-receivables/{pr_ids[0]}", json={"paid_amount": 8000.00}, headers=h)
        requests.put(f"{BASE}/payables-receivables/{pr_ids[2]}", json={"paid_amount": 3000.00}, headers=h)
        print("  Recorded partial payments")

    # --- Additional Users ---
    extra_users = [
        {"email": "accountant@danluq.com", "full_name": "Amina Bello", "password": "1234", "role": "accountant"},
        {"email": "inventory@danluq.com", "full_name": "Chukwu Emeka", "password": "1234", "role": "inventory_manager"},
        {"email": "manager@danluq.com", "full_name": "Yusuf Adamu", "password": "1234", "role": "manager"},
    ]
    for u in extra_users:
        r = requests.post(f"{BASE}/auth/register", json=u, headers=h)
        if r.status_code in (200, 201):
            print(f"  User: {u['full_name']} ({u['role']})")

    print("\nDemo data seeding complete!")
    print("\nUser accounts created:")
    print("  admin@danluq.com / 1234 (Admin)")
    print("  accountant@danluq.com / 1234 (Accountant)")
    print("  inventory@danluq.com / 1234 (Inventory Manager)")
    print("  manager@danluq.com / 1234 (Manager)")

if __name__ == "__main__":
    seed()
