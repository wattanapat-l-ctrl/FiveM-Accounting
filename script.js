/**
 * FiveM Accounting System - Architecture Core Logic (Fixed Live Update)
 * Vanilla JavaScript (Modular Structural Pattern)
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- STATE MANAGEMENT ---
    let state = {
        servers: [],
        products: [],
        sales: [],
        settings: {}
    };

    // --- CHART GLOBALS ---
    let dailyChartInstance = null;
    let monthlyChartInstance = null;

    // --- MODAL ACTION CALLBACK LINK ---
    let modalConfirmCallback = null;

    // --- DOM ELEMENT CACHE ---
    const DOM = {
        loadingOverlay: document.getElementById('loadingOverlay'),
        toastContainer: document.getElementById('toastContainer'),
        menuItems: document.querySelectorAll('.menu-item'),
        sections: document.querySelectorAll('.content-section'),
        pageTitle: document.getElementById('page-title'),
        
        // Dashboard
        totalSales: document.getElementById('total-sales'),
        totalCosts: document.getElementById('total-costs'),
        totalProfits: document.getElementById('total-profits'),
        countSales: document.getElementById('count-sales'),
        recentSalesTable: document.getElementById('recent-sales-table').querySelector('tbody'),
        btnNavToSales: document.getElementById('btn-nav-to-sales'),
        dashboardServerFilter: document.getElementById('dashboard-server-filter'),
        serverStatsBox: document.getElementById('server-stats-box'),
        svSales: document.getElementById('sv-sales'),
        svCosts: document.getElementById('sv-costs'),
        svProfits: document.getElementById('sv-profits'),
        svVolume: document.getElementById('sv-volume'),

        // Servers & Products forms
        serverForm: document.getElementById('server-form'),
        serverId: document.getElementById('server-id'),
        serverName: document.getElementById('server-name'),
        btnCancelServer: document.getElementById('btn-cancel-server'),
        serversTable: document.getElementById('servers-table').querySelector('tbody'),
        btnSaveServer: document.getElementById('btn-save-server'),
        
        productForm: document.getElementById('product-form'),
        productId: document.getElementById('product-id'),
        productServerId: document.getElementById('product-server-id'),
        productName: document.getElementById('product-name'),
        productCost: document.getElementById('product-cost'),
        btnCancelProduct: document.getElementById('btn-cancel-product'),
        productsTable: document.getElementById('products-table').querySelector('tbody'),
        btnSaveProduct: document.getElementById('btn-save-product'),

        // Sales Ledger Entry Form
        salesForm: document.getElementById('sales-form'),
        salesFormTitle: document.getElementById('sales-form-title'),
        saleId: document.getElementById('sale-id'),
        saleServerId: document.getElementById('sale-server-id'),
        saleProductId: document.getElementById('sale-product-id'),
        saleQuantity: document.getElementById('sale-quantity'),
        salePricePerM: document.getElementById('sale-price-per-m'),
        saleDate: document.getElementById('sale-date'),
        saleNote: document.getElementById('sale-note'),
        btnCancelSale: document.getElementById('btn-cancel-sale'),
        btnSaveSale: document.getElementById('btn-save-sale'),
        
        // Calculations Previews
        lblCostM: document.getElementById('lbl-cost-m'),
        lblTotalCost: document.getElementById('lbl-total-cost'),
        lblTotalRevenue: document.getElementById('lbl-total-revenue'),
        lblTotalProfit: document.getElementById('lbl-total-profit'),

        // Filters and Tables
        searchGeneral: document.getElementById('search-general'),
        searchDate: document.getElementById('search-date'),
        sortBy: document.getElementById('sort-by'),
        salesLedgerTable: document.getElementById('sales-ledger-table').querySelector('tbody'),
        btnExportCsv: document.getElementById('btn-export-csv'),
        btnPrint: document.getElementById('btn-print'),

        // Data Storage Operations
        btnExportJson: document.getElementById('btn-export-json'),
        importFile: document.getElementById('import-file'),
        fileChosenName: document.getElementById('file-chosen-name'),
        btnSubmitImport: document.getElementById('btn-submit-import'),
        btnTriggerReset: document.getElementById('btn-trigger-reset'),

        // Confirmation Modal
        confirmModal: document.getElementById('confirmModal'),
        modalTitle: document.getElementById('modal-title'),
        modalMessage: document.getElementById('modal-message'),
        btnModalConfirm: document.getElementById('btn-modal-confirm'),
        btnModalCancel: document.getElementById('btn-modal-cancel'),
        btnCloseModal: document.getElementById('btn-close-modal')
    };

    // --- INITIALIZATION ---
    function init() {
        loadDataFromLocalStorage();
        setupNavigation();
        setupFormListeners();
        setupRealtimeCalculationListeners();
        setupSearchAndFilters();
        setupDataUtilities();
        
        // Set Default Date field to today
        DOM.saleDate.value = new Date().toISOString().split('T')[0];
        
        // Pipeline ทำงานหลัก
        refreshUIHierarchy();
        initCharts();

        // Dismiss Loader overlay screen
        setTimeout(() => {
            DOM.loadingOverlay.classList.add('fade-out');
        }, 500);
    }

    // --- LOCALSTORAGE DATA PIPELINE ---
    function loadDataFromLocalStorage() {
        state.servers = JSON.parse(localStorage.getItem('servers')) || [];
        state.products = JSON.parse(localStorage.getItem('products')) || [];
        state.sales = JSON.parse(localStorage.getItem('sales')) || [];
        state.settings = JSON.parse(localStorage.getItem('settings')) || {};
    }

    // ฟังก์ชันสั่งอัปเดตและสั่งวาดการแสดงผลส่วนต่างๆ ทั้งหมดแบบ Synchronous ทันที
    function refreshUIHierarchy() {
        renderAllDropDowns();
        renderDashboard();
        renderServersTable();
        renderProductsTable();
        renderSalesLedgerTable();
        updateChartsData();
    }

    function autoSaveState() {
        localStorage.setItem('servers', JSON.stringify(state.servers));
        localStorage.setItem('products', JSON.stringify(state.products));
        localStorage.setItem('sales', JSON.stringify(state.sales));
        localStorage.setItem('settings', JSON.stringify(state.settings));
        
        // เรียกใช้การรีเฟรชโครงสร้างทั้งหมดทันทีที่มีการเปลี่ยนแปลงข้อมูล
        refreshUIHierarchy();
    }

    // --- NOTIFICATION COMPONENT ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'danger') icon = 'fa-exclamation-triangle';

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <div class="toast-message">${message}</div>
        `;
        
        DOM.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // --- GENERIC MODAL TRIGGER SYSTEM ---
    function askConfirmation(title, message, callback) {
        DOM.modalTitle.textContent = title;
        DOM.modalMessage.textContent = message;
        DOM.confirmModal.classList.add('active');
        modalConfirmCallback = callback;
    }

    DOM.btnModalConfirm.addEventListener('click', () => {
        if (modalConfirmCallback) modalConfirmCallback();
        DOM.confirmModal.classList.remove('active');
        modalConfirmCallback = null;
    });

    DOM.btnModalCancel.addEventListener('click', () => DOM.confirmModal.classList.remove('active'));
    DOM.btnCloseModal.addEventListener('click', () => DOM.confirmModal.classList.remove('active'));

    // --- SINGLE PAGE APPLICATION ROUTING NAV ---
    function setupNavigation() {
        DOM.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSectionId = item.getAttribute('data-target');
                
                DOM.menuItems.forEach(mi => mi.classList.remove('active'));
                DOM.sections.forEach(sec => sec.classList.remove('active'));
                
                item.classList.add('active');
                const targetSec = document.getElementById(targetSectionId);
                targetSec.classList.add('active');
                
                DOM.pageTitle.textContent = item.textContent.trim();
            });
        });

        DOM.btnNavToSales.addEventListener('click', () => {
            const salesMenuBtn = document.querySelector('[data-target="sales-section"]');
            if (salesMenuBtn) salesMenuBtn.click();
        });
    }

    // --- FORM VALIDATION UTILITY ---
    function validateInput(value, rules = {}) {
        if (rules.required && (value === null || value === undefined || value.toString().trim() === '')) {
            return 'กรุณากรอกข้อมูลให้ครบถ้วน ห้ามปล่อยว่าง';
        }
        if (rules.isNumber) {
            const num = Number(value);
            if (isNaN(num)) return 'ข้อมูลต้องเป็นตัวเลขเท่านั้น';
            if (rules.nonNegative && num < 0) return 'ค่าตัวเลขห้ามติดลบ';
            if (rules.greaterThanZero && num <= 0) return 'ค่าตัวเลขต้องมากกว่า 0';
        }
        return null;
    }

    // --- DEPENDENT DROP DOWNS RENDERING ---
    function renderAllDropDowns() {
        const prevSelectedFilter = DOM.dashboardServerFilter.value;
        const prevSelectedProductSv = DOM.productServerId.value;
        const prevSelectedSaleSv = DOM.saleServerId.value;

        // 1. Dashboard filter select options
        DOM.dashboardServerFilter.innerHTML = '<option value="all">-- แสดงทุกเซิร์ฟเวอร์ --</option>';
        state.servers.forEach(sv => {
            DOM.dashboardServerFilter.innerHTML += `<option value="${sv.id}">${escapeHtml(sv.name)}</option>`;
        });

        // 2. Product management filter select options
        DOM.productServerId.innerHTML = '<option value="">-- เลือกเซิร์ฟเวอร์ --</option>';
        state.servers.forEach(sv => {
            DOM.productServerId.innerHTML += `<option value="${sv.id}">${escapeHtml(sv.name)}</option>`;
        });

        // 3. Sales input select options
        DOM.saleServerId.innerHTML = '<option value="">-- เลือกเซิร์ฟเวอร์ --</option>';
        state.servers.forEach(sv => {
            DOM.saleServerId.innerHTML += `<option value="${sv.id}">${escapeHtml(sv.name)}</option>`;
        });

        // Restore selections
        if([...DOM.dashboardServerFilter.options].some(o => o.value === prevSelectedFilter)) DOM.dashboardServerFilter.value = prevSelectedFilter;
        if([...DOM.productServerId.options].some(o => o.value === prevSelectedProductSv)) DOM.productServerId.value = prevSelectedProductSv;
        if([...DOM.saleServerId.options].some(o => o.value === prevSelectedSaleSv)) DOM.saleServerId.value = prevSelectedSaleSv;
    }

    // Dynamic cascade loading of products assigned to specific chosen server
    DOM.saleServerId.addEventListener('change', () => {
        const serverId = DOM.saleServerId.value;
        DOM.saleProductId.innerHTML = '<option value="">-- เลือกสินค้า --</option>';
        
        if (!serverId) {
            DOM.saleProductId.disabled = true;
            resetCalculationsBox();
            return;
        }

        const filteredProducts = state.products.filter(p => p.serverId === serverId);
        if(filteredProducts.length === 0) {
            DOM.saleProductId.innerHTML = '<option value="">เซิร์ฟเวอร์นี้ไม่มีสินค้า กรุณาเพิ่มที่หน้าจัดการ</option>';
            DOM.saleProductId.disabled = true;
        } else {
            filteredProducts.forEach(p => {
                DOM.saleProductId.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)} (ต้นทุน: ฿${p.cost})</option>`;
            });
            DOM.saleProductId.disabled = false;
        }
        resetCalculationsBox();
    });

    DOM.saleProductId.addEventListener('change', triggerRealtimeCalculation);

    // --- CORE REALTIME RECALCULATIONS PIPELINE ---
    function setupRealtimeCalculationListeners() {
        DOM.saleQuantity.addEventListener('input', triggerRealtimeCalculation);
        DOM.salePricePerM.addEventListener('input', triggerRealtimeCalculation);
    }

    function triggerRealtimeCalculation() {
        const prodId = DOM.saleProductId.value;
        const qtyAttr = DOM.saleQuantity.value;
        const priceAttr = DOM.salePricePerM.value;

        if(!prodId || !qtyAttr || !priceAttr) {
            return;
        }

        const product = state.products.find(p => p.id === prodId);
        if(!product) return;

        const qty = parseFloat(qtyAttr);
        const sellPricePerM = parseFloat(priceAttr);
        const costPerM = parseFloat(product.cost);

        if(isNaN(qty) || isNaN(sellPricePerM)) return;

        const totalCost = qty * costPerM;
        const totalRevenue = qty * sellPricePerM;
        const profit = totalRevenue - totalCost;

        DOM.lblCostM.textContent = `฿${costPerM.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        DOM.lblTotalCost.textContent = `฿${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        DOM.lblTotalRevenue.textContent = `฿${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        DOM.lblTotalProfit.textContent = `฿${profit.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        
        if (profit < 0) {
            DOM.lblTotalProfit.className = "text-danger";
        } else {
            DOM.lblTotalProfit.className = "gold-text";
        }
    }

    function resetCalculationsBox() {
        DOM.lblCostM.textContent = "฿0";
        DOM.lblTotalCost.textContent = "฿0";
        DOM.lblTotalRevenue.textContent = "฿0";
        DOM.lblTotalProfit.textContent = "฿0";
        DOM.lblTotalProfit.className = "gold-text";
    }

    // --- DATA RENDERING FUNCTIONS ---
    
    function renderDashboard() {
        let salesSum = 0;
        let costsSum = 0;
        let profitsSum = 0;

        state.sales.forEach(s => {
            salesSum += s.revenue;
            costsSum += s.totalCost;
            profitsSum += s.profit;
        });

        DOM.totalSales.textContent = `฿${salesSum.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        DOM.totalCosts.textContent = `฿${costsSum.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        DOM.totalProfits.textContent = `฿${profitsSum.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        DOM.countSales.textContent = `${state.sales.length} รายการ`;

        // Render Recent sales subtable view
        DOM.recentSalesTable.innerHTML = '';
        const sortedRecent = [...state.sales].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        
        if(sortedRecent.length === 0) {
            DOM.recentSalesTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted">ไม่มีรายการขายล่าสุด</td></tr>';
        } else {
            sortedRecent.forEach(s => {
                const sv = state.servers.find(srv => srv.id === s.serverId);
                const svName = sv ? sv.name : 'Unknown';
                DOM.recentSalesTable.innerHTML += `
                    <tr>
                        <td>${formatThaiDate(s.date)}</td>
                        <td><span class="gold-text">${escapeHtml(svName)}</span></td>
                        <td>${escapeHtml(s.productName)}</td>
                        <td>${s.quantity} M</td>
                        <td><span class="${s.profit >= 0 ? 'text-success' : 'text-danger'}">฿${s.profit.toLocaleString()}</span></td>
                    </tr>
                `;
            });
        }
        
        renderServerSpecificDashboard();
    }

    DOM.dashboardServerFilter.addEventListener('change', renderServerSpecificDashboard);

    function renderServerSpecificDashboard() {
        const filterVal = DOM.dashboardServerFilter.value;
        if(filterVal === 'all') {
            DOM.serverStatsBox.classList.add('hidden');
            return;
        }

        DOM.serverStatsBox.classList.remove('hidden');
        const targetSales = state.sales.filter(s => s.serverId === filterVal);

        let svRev = 0, svCost = 0, svProf = 0, svVol = 0;
        targetSales.forEach(s => {
            svRev += s.revenue;
            svCost += s.totalCost;
            svProf += s.profit;
            svVol += s.quantity;
        });

        DOM.svSales.textContent = `฿${svRev.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        DOM.svCosts.textContent = `฿${svCost.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        DOM.svProfits.textContent = `฿${svProf.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        DOM.svVolume.textContent = `${svVol.toLocaleString()} M`;
    }

    function renderServersTable() {
        DOM.serversTable.innerHTML = '';
        if(state.servers.length === 0) {
            DOM.serversTable.innerHTML = '<tr><td colspan="2" class="text-center text-muted">ไม่พบข้อมูลเซิร์ฟเวอร์</td></tr>';
            return;
        }

        state.servers.forEach(sv => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(sv.name)}</strong></td>
                <td class="text-center">
                    <div class="btn-group" style="justify-content: center;">
                        <button class="btn btn-secondary btn-action btn-edit-sv" data-id="${sv.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-danger btn-action btn-del-sv" data-id="${sv.id}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            DOM.serversTable.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit-sv').forEach(b => b.addEventListener('click', () => editServer(b.dataset.id)));
        document.querySelectorAll('.btn-del-sv').forEach(b => b.addEventListener('click', () => deleteServer(b.dataset.id)));
    }

    function renderProductsTable() {
        DOM.productsTable.innerHTML = '';
        if(state.products.length === 0) {
            DOM.productsTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">ไม่พบข้อมูลสินค้า</td></tr>';
            return;
        }

        state.products.forEach(p => {
            const sv = state.servers.find(s => s.id === p.serverId);
            const svName = sv ? sv.name : 'N/A';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="text-muted">${escapeHtml(svName)}</span></td>
                <td><strong class="gold-text">${escapeHtml(p.name)}</strong></td>
                <td>฿${parseFloat(p.cost).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="text-center">
                    <div class="btn-group" style="justify-content: center;">
                        <button class="btn btn-secondary btn-action btn-edit-prod" data-id="${p.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-danger btn-action btn-del-prod" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            DOM.productsTable.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit-prod').forEach(b => b.addEventListener('click', () => editProduct(b.dataset.id)));
        document.querySelectorAll('.btn-del-prod').forEach(b => b.addEventListener('click', () => deleteProduct(b.dataset.id)));
    }

    function renderSalesLedgerTable() {
        DOM.salesLedgerTable.innerHTML = '';
        
        let filteredSales = [...state.sales];

        const qGeneral = DOM.searchGeneral.value.toLowerCase().trim();
        const qDate = DOM.searchDate.value;
        const sortCriteria = DOM.sortBy.value;

        if (qGeneral) {
            filteredSales = filteredSales.filter(s => {
                const sv = state.servers.find(srv => srv.id === s.serverId);
                const svName = sv ? sv.name.toLowerCase() : '';
                return svName.includes(qGeneral) || 
                       s.productName.toLowerCase().includes(qGeneral) || 
                       s.note.toLowerCase().includes(qGeneral);
            });
        }

        if (qDate) {
            filteredSales = filteredSales.filter(s => s.date === qDate);
        }

        if(sortCriteria === 'date-desc') filteredSales.sort((a,b) => new Date(b.date) - new Date(a.date));
        if(sortCriteria === 'date-asc') filteredSales.sort((a,b) => new Date(a.date) - new Date(b.date));
        if(sortCriteria === 'profit-desc') filteredSales.sort((a,b) => b.profit - a.profit);
        if(sortCriteria === 'revenue-desc') filteredSales.sort((a,b) => b.revenue - a.revenue);

        if(filteredSales.length === 0) {
            DOM.salesLedgerTable.innerHTML = '<tr><td colspan="11" class="text-center text-muted">ไม่พบข้อมูลบันทึกรายการขายตามตัวกรองค้นหาที่เลือก</td></tr>';
            return;
        }

        filteredSales.forEach(s => {
            const sv = state.servers.find(srv => srv.id === s.serverId);
            const svName = sv ? sv.name : 'Unknown Server';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatThaiDate(s.date)}</td>
                <td><span class="gold-text">${escapeHtml(svName)}</span></td>
                <td>${escapeHtml(s.productName)}</td>
                <td>${s.quantity} M</td>
                <td>฿${s.costPerM.toLocaleString()}</td>
                <td>฿${s.pricePerM.toLocaleString()}</td>
                <td class="text-danger">฿${s.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="text-success">฿${s.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td><strong class="${s.profit >= 0 ? 'text-success' : 'text-danger'}">฿${s.profit.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
                <td><small class="text-muted">${escapeHtml(s.note || '-')}</small></td>
                <td class="text-center no-print">
                    <div class="btn-group">
                        <button class="btn btn-secondary btn-action btn-edit-sale" data-id="${s.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn btn-danger btn-action btn-del-sale" data-id="${s.id}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            DOM.salesLedgerTable.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit-sale').forEach(b => b.addEventListener('click', () => editSale(b.dataset.id)));
        document.querySelectorAll('.btn-del-sale').forEach(b => b.addEventListener('click', () => deleteSale(b.dataset.id)));
    }

    function setupSearchAndFilters() {
        DOM.searchGeneral.addEventListener('input', renderSalesLedgerTable);
        DOM.searchDate.addEventListener('change', renderSalesLedgerTable);
        DOM.sortBy.addEventListener('change', renderSalesLedgerTable);
    }

    // --- CRUD EVENT HANDLERS & OPERATIONS ---

    function setupFormListeners() {
        // SERVER FORM SUBMIT
        DOM.serverForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = DOM.serverId.value;
            const name = DOM.serverName.value.trim();

            const err = validateInput(name, {required: true});
            if(err) { showToast(err, 'danger'); return; }

            const duplicate = state.servers.find(s => s.name.toLowerCase() === name.toLowerCase() && s.id !== id);
            if (duplicate) { showToast('ชื่อเซิร์ฟเวอร์นี้มีอยู่แล้วในระบบ', 'danger'); return; }

            if(id) { 
                const index = state.servers.findIndex(s => s.id === id);
                if(index !== -1) state.servers[index].name = name;
                showToast('แก้ไขข้อมูลเซิร์ฟเวอร์เรียบร้อย', 'success');
            } else { 
                state.servers.push({ id: generateUuid(), name });
                showToast('เพิ่มเซิร์ฟเวอร์ใหม่สำเร็จ', 'success');
            }

            resetServerForm();
            autoSaveState(); 
        });

        DOM.btnCancelServer.addEventListener('click', resetServerForm);

        // PRODUCT FORM SUBMIT
        DOM.productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = DOM.productId.value;
            const serverId = DOM.productServerId.value;
            const name = DOM.productName.value.trim();
            const costVal = DOM.productCost.value;

            let err = validateInput(serverId, {required: true}) || 
                      validateInput(name, {required: true}) || 
                      validateInput(costVal, {required: true, isNumber: true, nonNegative: true});
            
            if(err) { showToast(err, 'danger'); return; }
            const cost = parseFloat(costVal);

            const duplicate = state.products.find(p => p.serverId === serverId && p.name.toLowerCase() === name.toLowerCase() && p.id !== id);
            if(duplicate) { showToast('สินค้านี้มีอยู่แล้วในเซิร์ฟเวอร์ที่เลือก', 'danger'); return; }

            if(id) {
                const index = state.products.findIndex(p => p.id === id);
                if(index !== -1) {
                    state.products[index] = { id, serverId, name, cost };
                }
                showToast('แก้ไขข้อมูลสินค้าสำเร็จ', 'success');
            } else {
                state.products.push({ id: generateUuid(), serverId, name, cost });
                showToast('กำหนดต้นทุนสินค้าสำเร็จ', 'success');
            }

            resetProductForm();
            autoSaveState();
        });

        DOM.btnCancelProduct.addEventListener('click', resetProductForm);

        // SALES TRANSACTIONS LEDGER SUBMIT
        DOM.salesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = DOM.saleId.value;
            const serverId = DOM.saleServerId.value;
            const productId = DOM.saleProductId.value;
            const qtyVal = DOM.saleQuantity.value;
            const priceVal = DOM.salePricePerM.value;
            const date = DOM.saleDate.value;
            const note = DOM.saleNote.value.trim();

            let err = validateInput(serverId, {required: true}) ||
                      validateInput(productId, {required: true}) ||
                      validateInput(qtyVal, {required: true, isNumber: true, greaterThanZero: true}) ||
                      validateInput(priceVal, {required: true, isNumber: true, nonNegative: true}) ||
                      validateInput(date, {required: true});

            if(err) { showToast(err, 'danger'); return; }

            const quantity = parseFloat(qtyVal);
            const pricePerM = parseFloat(priceVal);
            
            const selectedProduct = state.products.find(p => p.id === productId);
            if(!selectedProduct) { showToast('ไม่พบข้อมูลโครงสร้างต้นทุนสินค้าชิ้นนี้', 'danger'); return; }

            const costPerM = selectedProduct.cost;
            const totalCost = quantity * costPerM;
            const revenue = quantity * pricePerM;
            const profit = revenue - totalCost;

            const salePayload = {
                id: id || generateUuid(),
                serverId,
                productId,
                productName: selectedProduct.name,
                quantity,
                costPerM,
                pricePerM,
                totalCost,
                revenue,
                profit,
                date,
                note
            };

            if(id) {
                const index = state.sales.findIndex(s => s.id === id);
                if(index !== -1) state.sales[index] = salePayload;
                showToast('อัปเดตรายการบัญชีสำเร็จ', 'success');
            } else {
                state.sales.push(salePayload);
                showToast('บันทึกยอดขายเสร็จสมบูรณ์', 'success');
            }

            resetSalesForm();
            autoSaveState();
        });

        DOM.btnCancelSale.addEventListener('click', resetSalesForm);
    }

    function resetServerForm() {
        DOM.serverId.value = '';
        DOM.serverForm.reset();
        DOM.btnCancelServer.classList.add('hidden');
        DOM.btnSaveServer.textContent = "บันทึกเซิร์ฟเวอร์";
    }

    function resetProductForm() {
        DOM.productId.value = '';
        DOM.productForm.reset();
        DOM.btnCancelProduct.classList.add('hidden');
        DOM.btnSaveProduct.textContent = "บันทึกสินค้า";
    }

    function resetSalesForm() {
        DOM.saleId.value = '';
        DOM.salesForm.reset();
        DOM.saleProductId.innerHTML = '<option value="">-- เลือกสินค้า --</option>';
        DOM.saleProductId.disabled = true;
        DOM.salesFormTitle.innerHTML = '<i class="fa-solid fa-cart-plus gold-text"></i> เพิ่มรายการขายใหม่';
        DOM.btnCancelSale.classList.add('hidden');
        DOM.saleDate.value = new Date().toISOString().split('T')[0];
        resetCalculationsBox();
    }

    function editServer(id) {
        const sv = state.servers.find(s => s.id === id);
        if(!sv) return;
        DOM.serverId.value = sv.id;
        DOM.serverName.value = sv.name;
        DOM.btnCancelServer.classList.remove('hidden');
        DOM.btnSaveServer.textContent = "อัปเดตเซิร์ฟเวอร์";
        DOM.serverName.focus();
    }

    function deleteServer(id) {
        askConfirmation(
            'ลบเซิร์ฟเวอร์ของคุณ?', 
            'คุณแน่ใจหรือไม่ที่จะลบเซิร์ฟเวอร์นี้? สินค้าและยอดขายทั้งหมดที่เชื่อมต่อกับเซิร์ฟเวอร์นี้จะยังคงอยู่แต่ชื่อเซิร์ฟเวอร์จะเปลี่ยนไปเป็นไม่ระบุชื่อ',
            () => {
                state.servers = state.servers.filter(s => s.id !== id);
                autoSaveState();
                showToast('ลบเซิร์ฟเวอร์เรียบร้อยแล้ว', 'info');
            }
        );
    }

    function editProduct(id) {
        const p = state.products.find(prod => prod.id === id);
        if(!p) return;
        DOM.productId.value = p.id;
        DOM.productServerId.value = p.serverId;
        DOM.productName.value = p.name;
        DOM.productCost.value = p.cost;
        DOM.btnCancelProduct.classList.remove('hidden');
        DOM.btnSaveProduct.textContent = "อัปเดตสินค้า";
        DOM.productName.focus();
    }

    function deleteProduct(id) {
        askConfirmation(
            'ยืนยันการลบสินค้า?',
            'สินค้าชิ้นนี้รวมถึงข้อมูลราคาทุนจะถูกดึงออกจากการจับคู่เซิร์ฟเวอร์ ยอดบัญชีเก่าจะไม่สูญหายข้อมูลเชิงประวัติศาสตร์',
            () => {
                state.products = state.products.filter(p => p.id !== id);
                autoSaveState();
                showToast('ลบข้อมูลสินค้าเรียบร้อย', 'info');
            }
        );
    }

    function editSale(id) {
        const s = state.sales.find(sale => sale.id === id);
        if(!s) return;
        
        DOM.saleId.value = s.id;
        DOM.saleServerId.value = s.serverId;
        
        DOM.saleServerId.dispatchEvent(new Event('change'));
        
        DOM.saleProductId.value = s.productId;
        DOM.saleQuantity.value = s.quantity;
        DOM.salePricePerM.value = s.pricePerM;
        DOM.saleDate.value = s.date;
        DOM.saleNote.value = s.note;

        DOM.salesFormTitle.innerHTML = '<i class="fa-solid fa-pen-to-square gold-text"></i> แก้ไขรายการขาย';
        DOM.btnCancelSale.classList.remove('hidden');
        
        triggerRealtimeCalculation();
        document.getElementById('sales-section').scrollIntoView({ behavior: 'smooth' });
    }

    function deleteSale(id) {
        askConfirmation(
            'ต้องการลบรายการขายนี้?',
            'คุณต้องการลบรายการขายนี้ออกจากบัญชีรายรับ-รายจ่ายของคุณใช่หรือไม่? (ข้อมูลยอดขายรวมจะถูกตัดลดทันที)',
            () => {
                state.sales = state.sales.filter(s => s.id !== id);
                autoSaveState();
                showToast('ลบรายการขายเรียบร้อยแล้ว', 'info');
            }
        );
    }

    // --- EXPORT TO CSV & NATIVE BROWSER PRINTING ---
    function setupDataUtilities() {
        DOM.btnExportCsv.addEventListener('click', () => {
            if(state.sales.length === 0) { showToast('ไม่มีข้อมูลยอดขายที่จะทำการส่งออก', 'danger'); return; }
            
            let csvContent = "\uFEFF"; 
            csvContent += "วันที่,เซิร์ฟเวอร์,สินค้า,จำนวน(M),ต้นทุนต่อ M,ราคาขายต่อ M,ต้นทุนรวม,ยอดขายรวม,กำไรสุทธิ,หมายเหตุ\n";
            
            state.sales.forEach(s => {
                const sv = state.servers.find(srv => srv.id === s.serverId);
                const svName = sv ? sv.name : 'Unknown';
                csvContent += `"${s.date}","${escapeCsv(svName)}","${escapeCsv(s.productName)}",${s.quantity},${s.costPerM},${s.pricePerM},${s.totalCost},${s.revenue},${s.profit},"${escapeCsv(s.note || '')}"\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `FiveM_Accounting_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('ส่งออกรายงาน CSV สำเร็จ', 'success');
        });

        DOM.btnPrint.addEventListener('click', () => {
            window.print();
        });

        // JSON EXPORT 
        DOM.btnExportJson.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `FiveM_Backup_${new Date().toISOString().split('T')[0]}.json`);
            dlAnchorElem.click();
            showToast('ดาวน์โหลดไฟล์สำรองข้อมูล JSON สำเร็จ', 'success');
        });

        // JSON FILE IMPORT DETECT ACTIONS
        DOM.importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            DOM.fileChosenName.textContent = file.name;
            DOM.btnSubmitImport.classList.remove('hidden');
        });

        DOM.btnSubmitImport.addEventListener('click', () => {
            const file = DOM.importFile.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if(parsed.servers && parsed.products && parsed.sales) {
                        askConfirmation(
                            'ยืนยันการเขียนทับข้อมูล?',
                            'ข้อมูลชุดเดิมที่ใช้งานอยู่บน LocalStorage ตอนนี้ทั้งหมดจะโดนเขียนทับด้วยข้อมูลสำรองจากไฟล์ที่เลือกนี้ทันที',
                            () => {
                                state.servers = parsed.servers;
                                state.products = parsed.products;
                                state.sales = parsed.sales;
                                state.settings = parsed.settings || {};
                                
                                autoSaveState();
                                
                                DOM.btnSubmitImport.classList.add('hidden');
                                DOM.fileChosenName.textContent = "นำเข้าข้อมูลสำเร็จ!";
                                showToast('กู้คืนระบบฐานข้อมูลเสร็จสิ้นสมบูรณ์', 'success');
                            }
                        );
                    } else {
                        showToast('โครงสร้างไฟล์ JSON ไม่ถูกต้องสำหรับระบบชุดข้อมูลนี้', 'danger');
                    }
                } catch(err) {
                    showToast('ไม่สามารถอ่านไฟล์ได้ โปรดตรวจสอบความถูกต้องของ JSON', 'danger');
                }
            };
            reader.readAsText(file);
        });

        // WIPE GLOBAL SYSTEM DATA CLEAN
        DOM.btnTriggerReset.addEventListener('click', () => {
            askConfirmation(
                'ล้างข้อมูลระบบทั้งหมดใช่หรือไม่? (คำเตือนที่ร้ายแรง)',
                'การกระทำนี้จะล้างข้อมูล ทุกเซิร์ฟเวอร์ รายการสินค้า และประวัติยอดขายทั้งหมดออกจากเครื่องนี้อย่างถาวรและไม่สามารถเรียกคืนได้อีก!',
                () => {
                    localStorage.clear();
                    state.servers = [];
                    state.products = [];
                    state.sales = [];
                    state.settings = {};
                    
                    autoSaveState();
                    resetServerForm();
                    resetProductForm();
                    resetSalesForm();
                    
                    showToast('ระบบล้างข้อมูลฐานข้อมูลทั้งหมดเรียบร้อยแล้ว', 'danger');
                }
            );
        });
    }

    // --- VISUAL ANALYTICS COMPONENT (CHART.JS PIPELINE) ---
    function initCharts() {
        const ctxDaily = document.getElementById('dailyChart').getContext('2d');
        const ctxMonthly = document.getElementById('monthlyChart').getContext('2d');

        const chartConfigOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0aec0' } },
                x: { grid: { display: false }, ticks: { color: '#a0aec0' } }
            },
            plugins: {
                legend: { labels: { color: '#f8f9fa', font: { family: 'Kanit' } } }
            }
        };

        dailyChartInstance = new Chart(ctxDaily, {
            type: 'bar',
            data: { labels: [], datasets: [] },
            options: chartConfigOptions
        });

        monthlyChartInstance = new Chart(ctxMonthly, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: chartConfigOptions
        });

        updateChartsData();
    }

    function updateChartsData() {
        if(!dailyChartInstance || !monthlyChartInstance) return;

        const dailyAgg = {};
        const monthlyAgg = {};

        state.sales.forEach(s => {
            if(!dailyAgg[s.date]) dailyAgg[s.date] = { revenue: 0, profit: 0 };
            dailyAgg[s.date].revenue += s.revenue;
            dailyAgg[s.date].profit += s.profit;

            const monthKey = s.date.substring(0, 7);
            if(!monthlyAgg[monthKey]) monthlyAgg[monthKey] = { revenue: 0, profit: 0 };
            monthlyAgg[monthKey].revenue += s.revenue;
            monthlyAgg[monthKey].profit += s.profit;
        });

        const sortedDays = Object.keys(dailyAgg).sort().slice(-7); 
        dailyChartInstance.data.labels = sortedDays.map(d => formatThaiDate(d));
        dailyChartInstance.data.datasets = [
            {
                label: 'ยอดขาย (฿)',
                data: sortedDays.map(d => dailyAgg[d].revenue),
                backgroundColor: 'rgba(30, 144, 255, 0.4)',
                borderColor: '#1e90ff',
                borderWidth: 1
            },
            {
                label: 'กำไรสุทธิ (฿)',
                data: sortedDays.map(d => dailyAgg[d].profit),
                backgroundColor: 'rgba(212, 175, 55, 0.5)',
                borderColor: '#d4af37',
                borderWidth: 1
            }
        ];
        dailyChartInstance.update();

        const sortedMonths = Object.keys(monthlyAgg).sort().slice(-12); 
        monthlyChartInstance.data.labels = sortedMonths.map(m => {
            const parts = m.split('-');
            return `${parts[1]}/${parts[0]}`;
        });
        monthlyChartInstance.data.datasets = [
            {
                label: 'ยอดขายรายเดือน (฿)',
                data: sortedMonths.map(m => monthlyAgg[m].revenue),
                borderColor: '#2ed573',
                backgroundColor: 'rgba(46, 213, 115, 0.05)',
                tension: 0.3,
                fill: true
            },
            {
                label: 'กำไรรายเดือน (฿)',
                data: sortedMonths.map(m => monthlyAgg[m].profit),
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.05)',
                tension: 0.3,
                fill: true
            }
        ];
        monthlyChartInstance.update();
    }

    // --- TECHNICAL SANITIZATION HELPERS ---
    function generateUuid() {
        return btoa(Math.random().toString()).substring(10, 25);
    }

    // ป้องกัน XSS Injection และตัดช่องว่างส่วนเกินเพื่อความปลอดภัย
    function escapeHtml(str) {
        if (!str) return '';
        return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function escapeCsv(str) {
        return str.toString().replace(/"/g, '""');
    }

    function formatThaiDate(dateString) {
        if(!dateString) return '-';
        const p = dateString.split('-');
        if(p.length !== 3) return dateString;
        return `${p[2]}/${p[1]}/${p[0]}`; 
    }

    init();
});