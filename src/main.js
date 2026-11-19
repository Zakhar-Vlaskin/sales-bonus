/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { sale_price, quentity } = purchase;
  const discount = 1 - purchase.discount / 100;

  return sale_price * quentity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;
  if (index === 1) {
    return profit * 0.15;
  } else if (index === 2 || index === 3) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    // Для всех остальных
    return total * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных

  if (
    !data ||
    !Array.isArray(data.customers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.customers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций

  const { calculateRevenue, calculateBonus } = options;

  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Не переданны функции");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = data.sellers.map((saller) => ({
    id: saller.id,
    name: `${saller.first_name} ${saller.last_name}`,
    revenue: 0, // Выручка
    profit: 0, // Прибыль
    sales_count: 0, // Количество продаж
    products_sold: {}, // Накапливает количество всех проданных товаров
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerIndex = sellerStats.reduce(
    (acc, item) => ({
      ...acc,
      [item.id]: item,
    }),
    {},
  ); // Ключом будет id, значением — запись из sellerStats

  const productIndex = data.products.reduce(
    (acc, item) => ({
      ...acc,
      [item.sku]: item,
    }),
    {},
  ); // Ключом будет sku, значением — запись из data.products

  // @TODO: Расчет выручки и прибыли для каждого продавца

  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    // Увеличить количество продаж
    sellerIndex.sales_count++;
    // Увеличить общую сумму выручки всех продаж
    sellerIndex.revenue += record.total_amount;

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * item.quantity;
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue = calculateRevenue(
        item.discount,
        item.sale_price,
        item.quantity,
      );
      // Посчитать прибыль: выручка минус себестоимость
      const profit = revenue - cost;
      // Увеличить общую накопленную прибыль (profit) у продавца
      sellerIndex.profit += profit;
      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      // По артикулу товара увеличить его проданное количество у продавца
      seller.products_sold[item.sku]++;
    });
  });
  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller); // Считаем бонус
    seller.top_products = Object.entries(seller.products_sold)
      .map((item) => ({
        sku: item[0],
        quentity: item[1],
      }))
      .sort((a, b) => b.quentity - a.quentity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id, // Строка, идентификатор продавца
    name: seller.name, // Строка, имя продавца
    revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, // Целое число, количество продаж продавца
    top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
    bonus: +seller.bonus.toFixed(2), // Число с двумя знаками после точки, бонус продавца
  }));
}
