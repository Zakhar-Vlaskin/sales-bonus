/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const {discount, sale_price, quantity} = purchase;

    discountDecimal = discount ? discount / 100 : 0;

    price = sale_price * quantity;

    remainder = price * (1 - discountDecimal);

    return parseFloat(remainder.toFixed(2));

}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // Рассчитываем бонус как процент от прибыли продавца
    if(index === 1) return seller.profit * 0.15; // 15% для первого места
    if(index === 2 || index === 3) return seller.profit * 0.10; // 10% для 2-3 мест
    if(index === total) return 0; // 0% для последнего места
    return seller.profit * 0.05; // 5% для всех остальных (включая предпоследнее)
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    // @TODO: Проверка входных данных

    if(!Array.isArray(data)){
        throw new Error('Data should be an array');
    }

    if (typeof options !== 'object' || options === null) {
        throw new Error('Options should be an object');
    }

    // @TODO: Проверка наличия опций
    const { calculateSimpleRevenue, calculateBonusByProfit } = options;
    
    if (typeof calculateSimpleRevenue !== 'function') {
        throw new Error('calculateSimpleRevenue function is required');
    }
    
    if (typeof calculateBonusByProfit !== 'function') {
        throw new Error('calculateBonusByProfit function is required');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
        const sellersMap = new Map(); // Для хранения данных по продавцам
        const productsMap = new Map(); // Для хранения данных по товарам
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    data.forEach(sale => {
        // Обработка продавца
        if (!sellersMap.has(sale.seller_id)) {
            sellersMap.set(sale.seller_id, {
                id: sale.seller_id,
                name: sale.seller_name,
                sales_count: 0,
                revenue: 0,
                profit: 0,
                products: new Set()
            });
        }
        
        const seller = sellersMap.get(sale.seller_id);
        seller.sales_count += 1;
        seller.revenue += sale.price * sale.count;
        seller.profit += (sale.price - sale.cost) * sale.count;
        seller.products.add(sale.product_id);
        
        // Обработка товара
        if (!productsMap.has(sale.product_id)) {
            productsMap.set(sale.product_id, {
                id: sale.product_id,
                name: sale.product_name,
                total_sold: 0
            });
        }
        
        const product = productsMap.get(sale.product_id);
        product.total_sold += sale.count;
    });

    // @TODO: Расчет выручки и прибыли для каждого продавца

        const sellersArray = Array.from(sellersMap.values());

    // @TODO: Сортировка продавцов по прибыли

     sellersArray.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования

     sellersArray.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(seller.profit, index + 1);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями

     return sellersArray.map(seller => {
        // Находим топовые товары продавца (3 самых продаваемых)
        const sellerProducts = Array.from(seller.products)
            .map(productId => productsMap.get(productId))
            .sort((a, b) => b.total_sold - a.total_sold)
            .slice(0, 3)
            .map(product => ({ id: product.id, name: product.name }));
        
        return {
            seller_id: seller.id,
            name: seller.name,
            sales_count: seller.sales_count,
            revenue: calculateSimpleRevenue(seller.revenue),
            profit: seller.profit,
            bonus: seller.bonus,
            top_products: sellerProducts
        };
    });

}
