/**
 * 获取当前时间减去指定分钟数的时间字符串
 * @param {number} minutes - 要减去的分钟数，默认为 10
 * @returns {string} 格式化后的时间字符串，如 "2026-01-28 19:25:00"
 */
export const getTimeMinusMinutes = (minutes = 10) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  const secs = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
};

/**
 * 获取当前时间字符串
 * @returns {string} 格式化后的当前时间字符串，如 "2026-01-28 19:25:00"
 */
export const getNow = () => {
  return getTimeMinusMinutes(0);
};
/**
 * 获取指定类型的时间段
 * @param {string} type - 时间段类型：'day'（日）、'month'（月）、'year'（年）
 * @returns {object} 包含开始时间、结束时间和类型的对象
 */
export const getTimeRange = (type = 'day') => {
  const now = new Date();
  let startDate, endDate;

  if (type === 'day') {
    // 日：当天0点到23:59:59
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
  } else if (type === 'month') {
    // 月：当月1日0点到当月最后一日23:59:59
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    // 获取当月最后一天
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    endDate = new Date(now.getFullYear(), now.getMonth(), lastDay, 23, 59, 59);
  } else if (type === 'year') {
    // 年：当年1月1日0点到12月31日23:59:59
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else {
    // 默认返回当天
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
  }

  // 格式化日期时间
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
  };

  return {
    endDate: formatDate(endDate),
    startDate: formatDate(startDate),
    type,
  };
};

/**
 * 获取从0点到当前时间的时间范围
 * @param {string} type - 时间段类型：'day'（日）、'month'（月）、'year'（年），默认为 'day'
 * @param {number} minusMinutes - 要从当前时间扣除的分钟数，默认为0
 * @returns {object} 包含开始时间、结束时间和类型的对象
 */
export const getNowRange = (type = 'day', minusMinutes = 0) => {
  const now = new Date();
  let startDate, endDate;

  // 计算结束时间（当前时间减去指定分钟数）
  const adjustedNow = new Date(now);
  if (minusMinutes > 0) {
    adjustedNow.setMinutes(adjustedNow.getMinutes() - minusMinutes);
  }

  if (type === 'day') {
    // 日：当天0点到调整后的当前时间
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    endDate = adjustedNow;
  } else if (type === 'month') {
    // 月：当月1日0点到调整后的当前时间
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    endDate = adjustedNow;
  } else if (type === 'year') {
    // 年：当年1月1日0点到调整后的当前时间
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    endDate = adjustedNow;
  } else {
    // 默认返回当天
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    endDate = adjustedNow;
  }

  // 格式化日期时间
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
  };

  return {
    endDate: formatDate(endDate),
    startDate: formatDate(startDate),
    type,
    minusMinutes,
  };
};

/**
 * 按照时间字段排序数据
 * - 若 time 为时间范围字符串（如 "2026-02-12 09:53:36-2026-02-12 10:00:57"），按前半段开始时间排序
 * @param {Array} data - 需要排序的数据数组
 * @param {string} order - 排序顺序：'asc'（升序）或 'desc'（降序），默认为 'asc'
 * @returns {Array} 排序后的数组
 */
export const sortByTime = (data, order = 'asc') => {
  if (!Array.isArray(data) || data.length === 0) {
    return data;
  }

  const orderNormalized = String(order).toLowerCase();
  const direction = orderNormalized === 'desc' ? -1 : 1;

  const parseStartTimeMs = (time) => {
    if (time == null) {
      return Number.NaN;
    }
    if (time instanceof Date) {
      return time.getTime();
    }
    if (typeof time === 'number') {
      return time;
    }

    const str = String(time).trim();
    const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    }

    const match = str.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
    );
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      ).getTime();
    }

    const ms = new Date(str).getTime();
    return Number.isNaN(ms) ? Number.NaN : ms;
  };

  return [...data].sort((a, b) => {
    const timeA = parseStartTimeMs(a?.time);
    const timeB = parseStartTimeMs(b?.time);

    const timeAInvalid = Number.isNaN(timeA);
    const timeBInvalid = Number.isNaN(timeB);
    if (timeAInvalid && timeBInvalid) {
      return 0;
    }
    if (timeAInvalid) {
      return 1;
    }
    if (timeBInvalid) {
      return -1;
    }

    return direction * (timeA - timeB);
  });
};

/**
 * 判断指定日期是否为工作日/节假日
 * @param {string} dateStr - 日期字符串，格式 yyyy-mm-dd
 * @param {object} options - 可选配置
 * @param {string[]} options.holidays - 指定为节假日的日期列表（优先级高于周末规则）
 * @param {string[]} options.workdays - 指定为工作日的日期列表（用于调休）
 * @returns {number} 0 为工作日，1 为节假日
 */
export const getDayType = (dateStr, options = {}) => {
  const { holidays = [], workdays = [] } = options;
  const normalizedDate = String(dateStr || '').trim();

  if (workdays.includes(normalizedDate)) {
    return 0;
  }
  if (holidays.includes(normalizedDate)) {
    return 1;
  }

  const match = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return 1;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  // 无效日期统一按节假日处理
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return 1;
  }

  const weekDay = date.getDay();
  return weekDay === 0 || weekDay === 6 ? 1 : 0;
};

/**
 * 获取当前日期的星期数（1-7，周一到周日）
 * @returns {number} 当前星期数
 */
export const getCurrentWeekday = () => {
  const weekDay = new Date().getDay();
  return weekDay === 0 ? 7 : weekDay;
};

export default {
  getTimeMinusMinutes,
  getTimeRange,
  getNowRange,
  sortByTime,
  getDayType,
  getCurrentWeekday,
};
