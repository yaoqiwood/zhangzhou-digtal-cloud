<template>
  <div class="structure-container">
    <div v-for="(item, index) in data" :key="index" class="chart-row">
      <div class="title-row">
        <span class="index-box">{{ index + 1 }}</span>
        <span class="title-text">{{ item.title }}</span>
      </div>

      <div class="bar-wrapper">
        <div class="bar-mask">
          <div
            v-for="(sub, i) in item.details"
            :key="i"
            class="bar-segment"
            :class="{ 'tooltip-top': index === data.length - 1 }"
            @mouseenter="adjustTooltip"
            @mouseleave="resetTooltip"
            :style="{
              width: sub.value + '%',
              backgroundColor: colors[i],
            }"
          >
            <span v-if="sub.value >= 8" class="segment-value">
              {{ sub.value }}%
            </span>
            <div class="segment-tooltip">
              <span class="tooltip-title">类型：{{ labels[i] }}</span>
              <span v-if="sub.amountText" class="tooltip-line">
                <span class="tooltip-label">实收：</span>
                <span class="tooltip-value">{{ sub.amountText }}</span>
              </span>
              <span v-else-if="sub.flowText" class="tooltip-line">
                <span class="tooltip-label">流量：</span>
                <span class="tooltip-value">{{ sub.flowText }}</span>
              </span>
              <span class="tooltip-line">
                <span class="tooltip-label">占比</span>
                <span class="tooltip-value">{{ sub.value }}%</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="legend-row">
      <div v-for="(label, i) in labels" :key="i" class="legend-item">
        <span class="dot" :style="{ backgroundColor: colors[i] }"></span>

        <span class="label-text">{{ label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { REGION_IDS } from '@/utils/constants.js';
import { FUZHOU_API_URLS } from '@/utils/fuzhou_api.js';
import http from '@/utils/http.js';
import { ref, onMounted, defineProps } from 'vue';

const props = defineProps({
  // 类别名称
  labels: {
    type: Array,
    default: () => ['小客车', '中大客车', '中小货车', '大货车'],
  },
});

// 图表数据
const data = ref([
  {
    title: '收入结构',
    details: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }],
  },
  {
    title: '流量结构',
    details: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }],
  },
]);

// 对应图中的四种颜色
const colors = ['#0055cc', '#00aa66', '#ccaa00', '#cc3333'];

const feeAmountKeyGroups = [
  ['xCarFee', 'xCarMoney', 'xCarAmt', 'xCarAmount', 'xCarIncome', 'xCar'],
  ['zdCarFee', 'zdCarMoney', 'zdCarAmt', 'zdCarAmount', 'zdCarIncome', 'zdCar'],
  [
    'zxtrunkFee',
    'zxtrunkMoney',
    'zxtrunkAmt',
    'zxtrunkAmount',
    'zxtrunkIncome',
    'zxtrunk',
  ],
  [
    'dtrunkFee',
    'dtrunkMoney',
    'dtrunkAmt',
    'dtrunkAmount',
    'dtrunkIncome',
    'dtrunk',
  ],
];

const flowKeyGroups = [
  ['xCarFlow'],
  ['zdCarFlow'],
  ['zxtrunkFlow'],
  ['dtrunkFlow'],
];

const formatCompactMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';

  const absAmount = Math.abs(amount);
  if (absAmount < 1000) return `${amount.toFixed(2).replace(/\.00$/, '')}元`;

  const units = [
    { value: 1e12, label: '万亿元' },
    { value: 1e8, label: '亿元' },
    { value: 1e4, label: '万元' },
    { value: 1e3, label: '千元' },
  ];

  const matchedUnit = units.find((unit) => absAmount >= unit.value);
  if (!matchedUnit) return `${amount.toFixed(2).replace(/\.00$/, '')}元`;

  const compactValue = amount / matchedUnit.value;
  const text = Number(compactValue.toFixed(compactValue >= 100 ? 0 : 2));
  return `${text}${matchedUnit.label}`;
};

const formatFlowCount = (value) => {
  const count = Number(value);
  if (!Number.isFinite(count)) return '';

  const absCount = Math.abs(count);
  if (absCount < 1000) return `${count}辆`;

  const units = [
    { value: 1e12, label: '万亿辆' },
    { value: 1e8, label: '亿辆' },
    { value: 1e6, label: '百万辆' },
    { value: 1e4, label: '万辆' },
    { value: 1e3, label: '千辆' },
  ];

  const matchedUnit = units.find((unit) => absCount >= unit.value);
  if (!matchedUnit) return `${count}辆`;

  const compactValue = count / matchedUnit.value;
  const text = Number(compactValue.toFixed(compactValue >= 100 ? 0 : 2));
  return `${text}${matchedUnit.label}`;
};

const getValueByIndexAndKeys = (sourceData, index, keyGroups = []) => {
  const candidateKeys = keyGroups[index] || [];
  for (let i = 0; i < candidateKeys.length; i += 1) {
    const key = candidateKeys[i];
    const value = Number(sourceData?.[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

// 获取后端数据
const fetchData = async () => {
  try {
    const response = await http.get(FUZHOU_API_URLS.fee.getFeeInfo, {
      origid: REGION_IDS.FUZHOU,
    });
    const result = response;

    if (result && result.length > 0) {
      const feeData = result[0];

      console.log('feeData:');
      console.log(feeData);

      // 更新收入结构（百分比）
      data.value[0].details = [
        {
          value: parseFloat((feeData.xCarRate * 100).toFixed(2)),
          amountText: formatCompactMoney(
            getValueByIndexAndKeys(feeData, 0, feeAmountKeyGroups)
          ),
        }, // 小客车
        {
          value: parseFloat((feeData.zdCarRate * 100).toFixed(2)),
          amountText: formatCompactMoney(
            getValueByIndexAndKeys(feeData, 1, feeAmountKeyGroups)
          ),
        }, // 中大货车
        {
          value: parseFloat((feeData.zxtrunkRate * 100).toFixed(2)),
          amountText: formatCompactMoney(
            getValueByIndexAndKeys(feeData, 2, feeAmountKeyGroups)
          ),
        }, // 中小货车
        {
          value: parseFloat((feeData.dtrunkRate * 100).toFixed(2)),
          amountText: formatCompactMoney(
            getValueByIndexAndKeys(feeData, 3, feeAmountKeyGroups)
          ),
        }, // 大货车
      ];

      // 更新流量结构（百分比）
      data.value[1].details = [
        {
          value: parseFloat((feeData.xCarFlowRate * 100).toFixed(2)),
          flowText: formatFlowCount(
            getValueByIndexAndKeys(feeData, 0, flowKeyGroups)
          ),
        }, // 小客车
        {
          value: parseFloat((feeData.zdCarFlowRate * 100).toFixed(2)),
          flowText: formatFlowCount(
            getValueByIndexAndKeys(feeData, 1, flowKeyGroups)
          ),
        }, // 中大货车
        {
          value: parseFloat((feeData.zxtrunkFlowRate * 100).toFixed(2)),
          flowText: formatFlowCount(
            getValueByIndexAndKeys(feeData, 2, flowKeyGroups)
          ),
        }, // 中小货车
        {
          value: parseFloat((feeData.dtrunkFlowRate * 100).toFixed(2)),
          flowText: formatFlowCount(
            getValueByIndexAndKeys(feeData, 3, flowKeyGroups)
          ),
        }, // 大货车
      ];
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchData();
});

const adjustTooltip = (event) => {
  const segmentEl = event.currentTarget;
  if (!segmentEl) return;
  const tooltipEl = segmentEl.querySelector('.segment-tooltip');
  if (!tooltipEl) return;
  const containerEl = segmentEl.closest('.bar-wrapper');
  if (!containerEl) return;

  const containerRect = containerEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  const segmentRect = segmentEl.getBoundingClientRect();

  const idealLeft =
    segmentRect.left + segmentRect.width / 2 - tooltipRect.width / 2;
  const idealRight = idealLeft + tooltipRect.width;

  let shift = 0;
  if (idealLeft < containerRect.left) {
    shift = containerRect.left - idealLeft;
  } else if (idealRight > containerRect.right) {
    shift = containerRect.right - idealRight;
  }

  tooltipEl.style.setProperty('--tooltip-shift', `${shift}px`);
};

const resetTooltip = (event) => {
  const segmentEl = event.currentTarget;
  if (!segmentEl) return;
  const tooltipEl = segmentEl.querySelector('.segment-tooltip');
  if (!tooltipEl) return;
  tooltipEl.style.setProperty('--tooltip-shift', '0px');
};
</script>

<style lang="less" scoped>
.structure-container {
  // background-color: #000a1a; // 深蓝底色
  padding: 0px;
  color: #fff;
  font-family: sans-serif;
  width: 100%;
  max-width: 600px;
  margin-top: 0;
  .chart-row {
    margin-bottom: 2px;

    .title-row {
      display: flex;
      align-items: center;
      margin-bottom: 6px;

      .index-box {
        border: 1px solid #1890ff;
        color: #1890ff;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        margin-right: 10px;
      }

      .title-text {
        font-size: 13px;
        letter-spacing: 1px;
      }
    }

    .bar-wrapper {
      width: 100%;
      position: relative;
      padding-bottom: 16px;

      .bar-mask {
        display: flex;
        height: 30px;
        width: 100%;
        border-radius: 4px;
        overflow: visible;
      }

      .bar-segment {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: bold;
        transition: width 0.5s ease; // 增加动效
        border-right: 1px solid rgba(0, 0, 0, 0.2); // 细微分割线

        &:first-child {
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
        }

        &:last-child {
          border-right: none;
          border-top-right-radius: 4px;
          border-bottom-right-radius: 4px;
        }
      }

      .segment-value {
        pointer-events: none;
      }

      .segment-tooltip {
        position: absolute;
        left: 50%;
        top: 100%;
        transform: translate(-50%, 8px) translateX(var(--tooltip-shift, 0px));
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        min-width: 104px;
        padding: 8px 10px;
        border: 1px solid rgba(24, 144, 255, 0.28);
        border-radius: 6px;
        font-size: 14px;
        font-family: sans-serif;
        font-weight: 400;
        white-space: nowrap;
        color: #6d6e73;
        background: rgba(255, 255, 255, 0.98);
        box-shadow:
          0 8px 18px rgba(0, 0, 0, 0.35),
          inset 0 0 12px rgba(77, 166, 255, 0.08);
        opacity: 0;
        visibility: hidden;
        transition:
          opacity 0.2s ease,
          visibility 0.2s ease,
          transform 0.2s ease;
        z-index: 4;
        pointer-events: none;

        &::before {
          content: '';
          position: absolute;
          left: 50%;
          top: -6px;
          width: 10px;
          height: 10px;
          border-top: 1px solid rgba(24, 144, 255, 0.28);
          border-left: 1px solid rgba(24, 144, 255, 0.28);
          background: rgba(255, 255, 255, 0.98);
          transform: translateX(calc(-50% - var(--tooltip-shift, 0px)))
            rotate(45deg);
        }
      }

      .bar-segment:hover .segment-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, 4px) translateX(var(--tooltip-shift, 0px));
      }

      .bar-segment.tooltip-top .segment-tooltip {
        top: auto;
        bottom: 100%;
        transform: translate(-50%, -8px) translateX(var(--tooltip-shift, 0px));

        &::before {
          top: auto;
          bottom: -6px;
          border-top: none;
          border-left: none;
          border-right: 1px solid rgba(24, 144, 255, 0.28);
          border-bottom: 1px solid rgba(24, 144, 255, 0.28);
        }
      }

      .bar-segment.tooltip-top:hover .segment-tooltip {
        transform: translate(-50%, -4px) translateX(var(--tooltip-shift, 0px));
      }

      .tooltip-title {
        color: #6d6e73;
        font-size: 14px;
        line-height: 1.2;
      }

      .tooltip-line {
        display: flex;
        align-items: center;
        gap: 6px;
        line-height: 1.2;
      }

      .tooltip-label {
        color: #6d6e73;
      }

      .tooltip-value {
        color: #6d6e73;
      }
    }
  }

  .legend-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    margin-top: 4px;

    .legend-item {
      display: flex;
      align-items: center;
      // width: 100%;

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        margin-right: 8px;
      }

      .label-text {
        display: inline-block;
        // width: 60px;
        white-space: nowrap;
        width: 25%;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}
</style>
