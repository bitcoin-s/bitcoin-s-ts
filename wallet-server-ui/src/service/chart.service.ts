import { Injectable } from '@angular/core'
import { Chart, ChartData, ChartDataset, ChartOptions } from 'chart.js'
import { TranslateService } from '@ngx-translate/core'

import { DarkModeService } from './dark-mode.service'

import { formatNumber } from '~util/utils'


const MATERIAL_PURPLE = 'rgb(125,79,194)'
const MATERIAL_DARK_MODE_LABEL = 'rgba(255, 255, 255, 0.7)'
const SUREDBITS_BLUE = 'rgb(50,75,90)'
const SUREDBITS_BLUE_OFFSET = 'rgb(131,147,156)'
const SUREDBITS_ORANGE = 'rgb(236,73,58)'
const SUREDBITS_ORANGE_OFFSET = 'rgb(244,154,140)'

@Injectable({ providedIn: 'root' })
export class ChartService {

  private satoshisLabel: string
  private payoutLabel: string
  private outcomeLabel: string

  constructor(private darkModeService: DarkModeService, private translate: TranslateService) {
    this.satoshisLabel = this.translate.instant('unit.satoshis')
    this.payoutLabel = this.translate.instant('newOffer.payout')
    this.outcomeLabel = this.translate.instant('newOffer.outcome')
  }

  private getColor() {
    if (this.darkModeService.isDarkMode) {
      return 'white'
    }
    return <string>Chart.defaults.color
  }

  getChartData() {
    let chartData: ChartData<'scatter'> = {
      datasets: [{
        data: [],
        label: this.translate.instant('contractDetail.payoutCurve'),
        backgroundColor: MATERIAL_PURPLE,
        borderColor: MATERIAL_PURPLE,
        pointHoverBackgroundColor: SUREDBITS_BLUE_OFFSET,
        pointHoverBorderColor: SUREDBITS_BLUE_OFFSET,
        pointHoverRadius: 8,
        fill: false,
        tension: 0,
        showLine: true,
      }, ]
    }
    return chartData
  }

  getChartOptions(units: string) {
    let chartOptions: ChartOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: {
            color: this.getColor()
          },
          title: {
            display: true,
            text: units,
            color: this.getColor()
          }
        },
        y: {
          ticks: {
            color: this.getColor()
          },
          title: {
            display: true,
            text: this.satoshisLabel,
            color: this.getColor(),
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: this.getColor(),
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              // console.debug('label context:', context)
              let label = ' ' + this.outcomeLabel + ' : ' + context.label + ' ' + units
              return label
            },
            afterLabel: (context) => {
              // console.debug('afterLabel context:', context)
              let text = ' ' + this.payoutLabel + ' : ' + formatNumber((<any>context).raw.y) + ' ' + this.satoshisLabel
              return text
            }
          }
        }
      }
    }
    return chartOptions
  }

  getOutcomeChartDataset() {
    let chartDataOutcome: ChartDataset<'scatter'> = {
      data: [],
      label: this.translate.instant('newOffer.outcome'),
      backgroundColor: SUREDBITS_ORANGE,
      borderColor: SUREDBITS_ORANGE,
      pointHoverBackgroundColor: SUREDBITS_ORANGE_OFFSET,
      pointHoverBorderColor: SUREDBITS_ORANGE_OFFSET,
      fill: false,
      tension: 0,
      showLine: false,
      pointRadius: 5,
      pointHoverRadius: 8,
    }
    return chartDataOutcome
  }
  
}
