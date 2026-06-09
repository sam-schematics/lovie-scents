// Lovie Scents - Premium Core Storage, Analytics Metrics & Real-time Fulfillment Engine
document.addEventListener('DOMContentLoaded', () => {
    
    // Core Client State Array Storage
    let shoppingBag = [];
    
    // Client Facing DOM Nodes
    const cartBadgeElement = document.querySelector('.cart-count');
    const bagButtons = document.querySelectorAll('.add-to-bag-btn');
    const checkoutItemsList = document.getElementById('checkoutItemsList');
    const checkoutTotalAmount = document.getElementById('checkoutTotalAmount');
    const orderPlacementForm = document.getElementById('orderPlacementForm');
    
    // Administrative Portal DOM Nodes
    const navAdminBtn = document.getElementById('navAdminBtn');
    const adminSecretKeyField = document.getElementById('adminSecretKeyField');
    const adminLoginSubmitBtn = document.getElementById('adminLoginSubmitBtn');
    const authErrorDisplay = document.getElementById('authErrorDisplay');
    const adminPanelSection = document.getElementById('admin-panel');
    const adminOrdersDisplayTable = document.getElementById('adminOrdersDisplayTable');
    const clearAllOrdersBtn = document.getElementById('clearAllOrdersBtn');
    
    // Analytics Widget Elements
    const metricTotalOrders = document.getElementById('metricTotalOrders');
    const metricTotalRevenue = document.getElementById('metricTotalRevenue');
    const metricTopProduct = document.getElementById('metricTopProduct');
    
    // Automation Dock Nodes
    const runSystemTestBtn = document.getElementById('runSystemTestBtn');

    // ==========================================
    // 1. CLIENT BAG ENGINE LOGIC
    // ==========================================
    bagButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name');
            const price = parseInt(card.getAttribute('data-price'), 10);

            // Scan if fragrance already exists in state pouch
            const matchingItem = shoppingBag.find(item => item.id === id);
            if (matchingItem) {
                matchingItem.qty += 1;
            } else {
                shoppingBag.push({ id, name, price, qty: 1 });
            }

            refreshBagUI();
            
            // Visual Interaction Feedback
            const initialLabel = btn.textContent;
            btn.textContent = "Added to Pouch";
            btn.style.backgroundColor = "#BA9299";
            btn.style.color = "#FFFFFF";
            
            setTimeout(() => {
                btn.textContent = initialLabel;
                btn.style.backgroundColor = "transparent";
                btn.style.color = "#2A2525";
            }, 900);
        });
    });

    function refreshBagUI() {
        const cumulativeQty = shoppingBag.reduce((acc, current) => acc + current.qty, 0);
        cartBadgeElement.textContent = cumulativeQty;

        if (shoppingBag.length === 0) {
            checkoutItemsList.innerHTML = `<p class="empty-msg">Your luxury shopping bag is currently empty.</p>`;
            checkoutTotalAmount.textContent = "KSh 0";
            return;
        }

        let dynamicReceiptHTML = '';
        let sumTotal = 0;

        shoppingBag.forEach(item => {
            const subtotal = item.price * item.qty;
            sumTotal += subtotal;
            dynamicReceiptHTML += `
                <div class="summary-item-row">
                    <span>${item.name} <strong>(x${item.qty})</strong></span>
                    <span>KSh ${subtotal.toLocaleString()}</span>
                </div>
            `;
        });

        checkoutItemsList.innerHTML = dynamicReceiptHTML;
        checkoutTotalAmount.textContent = `KSh ${sumTotal.toLocaleString()}`;
    }

    // ==========================================
    // 2. CLIENT SUBMISSION PORT (PAY ON DELIVERY LOGS)
    // ==========================================
    orderPlacementForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (shoppingBag.length === 0) {
            alert("Your luxury bag is completely empty. Please select a perfume from our collection above first!");
            return;
        }

        executeOrderSave(
            document.getElementById('custName').value,
            document.getElementById('custPhone').value,
            document.getElementById('custLocation').value
        );
    });

    function executeOrderSave(name, phone, location) {
        const localTime = new Date().toLocaleString();
        const totalBillVal = shoppingBag.reduce((acc, item) => acc + (item.price * item.qty), 0);
        
        // Structure individual products ordered array to a single data row string for database viewing
        const productsFormatted = shoppingBag.map(item => `${item.name} (x${item.qty})`).join(', ');

        // Instantiate new entity object tracking product metrics
        const newOrderObj = {
            id: 'ORD-' + Date.now().toString().slice(-6),
            time: localTime,
            clientName: name,
            clientPhone: phone,
            deliveryLocation: location,
            items: productsFormatted,
            rawBillAmount: totalBillVal,
            status: 'Pending Dispatch'
        };

        // Pull previous collection history lists
        let registeredOrders = JSON.parse(localStorage.getItem('lovie_scents_db')) || [];
        registeredOrders.push(newOrderObj);

        // Commit directly into local browser storage matrix
        localStorage.setItem('lovie_scents_db', JSON.stringify(registeredOrders));

        alert(` ✨ Luxury Order Confirmed, ${name}! Your request has been logged into our distribution database. Our team will courier your package free of charge. Balance of KSh ${totalBillVal.toLocaleString()} is payable via Cash or M-Pesa on Delivery!`);

        // Wiping frontend variables clean
        shoppingBag = [];
        orderPlacementForm.reset();
        refreshBagUI();
        
        // Silently reload workspace metrics behind screen
        syncAdminConsole();
    }

    // ==========================================
    // 3. SECURE PASS-TOKEN VALIDATION SYSTEM
    // ==========================================
    adminLoginSubmitBtn.addEventListener('click', () => {
        const passwordInput = adminSecretKeyField.value;

        // Default verification token parameter set to 'admin'
        if (passwordInput === "admin") {
            authErrorDisplay.classList.add('hidden');
            adminPanelSection.classList.remove('hidden');
            adminSecretKeyField.value = "";
            syncAdminConsole();
            adminPanelSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            authErrorDisplay.classList.remove('hidden');
            adminPanelSection.classList.add('hidden');
        }
    });

    navAdminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('admin-auth-anchor').scrollIntoView({ behavior: 'smooth' });
    });

    // ==========================================
    // 4. ADMIN DASHBOARD OPERATIONS ENGINE
    // ==========================================
    function syncAdminConsole() {
        const database = JSON.parse(localStorage.getItem('lovie_scents_db')) || [];
        
        // Execute Metric Calculation loops
        metricTotalOrders.textContent = database.length;
        
        const calculationGrossRevenue = database.reduce((sum, order) => sum + order.rawBillAmount, 0);
        metricTotalRevenue.textContent = `KSh ${calculationGrossRevenue.toLocaleString()}`;

        // Compute top selling perfume using item text scanning frequencies
        if (database.length === 0) {
            metricTopProduct.textContent = "None Active";
            adminOrdersDisplayTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #BA9299; padding: 40px; font-style: italic;">
                        Administrative Registry is currently empty. Incoming customer orders will appear inside this terminal in real-time.
                    </td>
                </tr>`;
            return;
        }

        // Analytical frequency algorithm for favorite product estimation
        let occurrencesMap = {};
        database.forEach(ord => {
            if(ord.items.includes("Amour Infini")) occurrencesMap["Amour Infini"] = (occurrencesMap["Amour Infini"] || 0) + 1;
            if(ord.items.includes("Pétale Doux")) occurrencesMap["Pétale Doux"] = (occurrencesMap["Pétale Doux"] || 0) + 1;
            if(ord.items.includes("Nuit Étoilée")) occurrencesMap["Nuit Étoilée"] = (occurrencesMap["Nuit Étoilée"] || 0) + 1;
            if(ord.items.includes("Chérie Gold")) occurrencesMap["Chérie Gold"] = (occurrencesMap["Chérie Gold"] || 0) + 1;
            if(ord.items.includes("Oud Majestueux")) occurrencesMap["Oud Majestueux"] = (occurrencesMap["Oud Majestueux"] || 0) + 1;
            if(ord.items.includes("Sable Doré")) occurrencesMap["Sable Doré"] = (occurrencesMap["Sable Doré"] || 0) + 1;
        });

        let dominantItem = "None Checked";
        let topCount = 0;
        for (const [key, val] of Object.entries(occurrencesMap)) {
            if (val > topCount) {
                topCount = val;
                dominantItem = key;
            }
        }
        metricTopProduct.textContent = dominantItem + ` (${topCount} Units)`;

        // Inverting table output array loop so the newest incoming order highlights on top
        let tabularRowsHTML = '';
        database.forEach((order, index) => {
            const trackingButtonCode = order.status === 'Pending Dispatch' 
                ? `<button class="btn-dispatch" onclick="window.dispatchOrder(${index})">Mark Dispatched</button>`
                : `<span class="dispatched-status">✅ Handed to Courier</span>`;

            tabularRowsHTML += `
                <tr>
                    <td><strong>${order.time}</strong><br><small style="color:#7A6F71;">ID: ${order.id}</small></td>
                    <td>
                        <strong>${order.clientName}</strong><br>
                        <span style="color: #BA9299; font-weight: 500;">${order.clientPhone}</span>
                    </td>
                    <td><span style="color: #EAE2E4;">${order.deliveryLocation}</span></td>
                    <td><span class="admin-item-line">${order.items}</span></td>
                    <td><strong style="color: #49C182;">KSh ${order.rawBillAmount.toLocaleString()}</strong></td>
                    <td>${trackingButtonCode}</td>
                </tr>
            `;
        });
        adminOrdersDisplayTable.innerHTML = tabularRowsHTML;
    }

    // Global dispatch status modifier loop
    window.dispatchOrder = (idx) => {
        let currentDB = JSON.parse(localStorage.getItem('lovie_scents_db')) || [];
        if(currentDB[idx]) {
            currentDB[idx].status = 'Dispatched';
            localStorage.setItem('lovie_scents_db', JSON.stringify(currentDB));
            syncAdminConsole();
        }
    };

    // Database flushing validation hook
    clearAllOrdersBtn.addEventListener('click', () => {
        if (confirm("🚨 WARNING: Are you certain you want to permanently clear the client and order database collections? This action cannot be reversed.")) {
            localStorage.removeItem('lovie_scents_db');
            syncAdminConsole();
        }
    });

    // ==========================================
    // 5. EMBEDDED AUTOMATION SYSTEM TESTING
    // ==========================================
    runSystemTestBtn.addEventListener('click', () => {
        console.log("Starting Lovie Scents system loop diagnostic check...");
        
        // Simulating items loading actions into global state parameters
        shoppingBag = [
            { id: 'p3', name: 'Nuit Étoilée', price: 16000, qty: 1 },
            { id: 'p5', name: 'Oud Majestueux', price: 19500, qty: 2 }
        ];
        refreshBagUI();

        // Target delivery parameter details mockup configuration
        const dummyNames = ["Baraka Kiprop", "Mwende Mutua", "Juma Omwamba", "Farida Hussein"];
        const dummyLocations = ["Nairobi, Westlands, Delta Towers Wing B", "Mombasa Town, Nyali Estate, Plot 14", "Kisumu, Milimani Road, House 8"];
        
        const randomizedName = dummyNames[Math.floor(Math.random() * dummyNames.length)];
        const randomizedLocation = dummyLocations[Math.floor(Math.random() * dummyLocations.length)];
        const randomizedPhone = "07" + Math.floor(10000000 + Math.random() * 90000000).toString();

        // Direct Execution Loop triggering automated record logs placement injection
        setTimeout(() => {
            executeOrderSave(randomizedName, randomizedPhone, randomizedLocation);
            alert(`🧪 AUTOMATION SUCCESSFUL:\nAn order for "${randomizedName}" has been simulated and injected into your admin registry backend. Enter "admin" password inside the Administrative Gate below to check it live!`);
        }, 500);
    });
});
                  
