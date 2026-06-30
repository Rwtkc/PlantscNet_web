const lanczosCoefficients = [
  676.5203681218851,
  -1259.1392167224028,
  771.3234287776531,
  -176.6150291621406,
  12.507343278686905,
  -0.13857109526572012,
  9.984369578019572e-6,
  1.5056327351493116e-7,
]

export function normalTwoSidedPValue(zScore) {
  return Math.max(0, Math.min(1, erfc(Math.abs(zScore) / Math.SQRT2)))
}

export function mannWhitneyAuc(positiveScores, negativeScores) {
  const positives = positiveScores.length
  const negatives = negativeScores.length

  if (positives === 0 || negatives === 0) {
    return { auc: 0, pValue: 1 }
  }

  const ranked = [
    ...positiveScores.map((score) => ({ score, positive: true })),
    ...negativeScores.map((score) => ({ score, positive: false })),
  ].sort((left, right) => left.score - right.score)

  let rankSum = 0
  let index = 0

  while (index < ranked.length) {
    let end = index + 1

    while (end < ranked.length && ranked[end].score === ranked[index].score) {
      end += 1
    }

    const averageRank = (index + 1 + end) / 2

    for (let rankIndex = index; rankIndex < end; rankIndex += 1) {
      if (ranked[rankIndex].positive) {
        rankSum += averageRank
      }
    }

    index = end
  }

  const uStatistic = rankSum - (positives * (positives + 1)) / 2
  const auc = uStatistic / (positives * negatives)
  const mean = (positives * negatives) / 2
  const variance = (positives * negatives * (positives + negatives + 1)) / 12
  const zScore = variance > 0 ? (uStatistic - mean) / Math.sqrt(variance) : 0

  return {
    auc,
    pValue: normalTwoSidedPValue(zScore),
  }
}

export function hypergeometricLogPmf(successes, population, successStates, draws) {
  if (
    successes < 0 ||
    successes > successStates ||
    successes > draws ||
    draws > population ||
    successStates > population
  ) {
    return Number.NEGATIVE_INFINITY
  }

  return (
    logCombination(successStates, successes) +
    logCombination(population - successStates, draws - successes) -
    logCombination(population, draws)
  )
}

export function formatProbability(value) {
  if (!Number.isFinite(value)) {
    return '<1e-323'
  }

  if (value === 0) {
    return '<1e-323'
  }

  if (value > 0 && value < 0.001) {
    return value.toExponential(3)
  }

  return value.toPrecision(4)
}

export function formatLogProbability(logValue) {
  if (!Number.isFinite(logValue)) {
    return '<1e-323'
  }

  if (logValue < Math.log(Number.MIN_VALUE)) {
    return `<1e${Math.ceil(logValue / Math.LN10)}`
  }

  return formatProbability(Math.exp(logValue))
}

function logCombination(n, k) {
  if (k < 0 || k > n) {
    return Number.NEGATIVE_INFINITY
  }

  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1)
}

function logGamma(value) {
  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value)
  }

  let x = 0.9999999999998099
  const shifted = value - 1

  for (let index = 0; index < lanczosCoefficients.length; index += 1) {
    x += lanczosCoefficients[index] / (shifted + index + 1)
  }

  const t = shifted + lanczosCoefficients.length - 0.5

  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x)
}

function erfc(value) {
  const z = Math.abs(value)
  const t = 1 / (1 + z / 2)
  const polynomial =
    -z * z -
    1.26551223 +
    t *
      (1.00002368 +
        t *
          (0.37409196 +
            t *
              (0.09678418 +
                t *
                  (-0.18628806 +
                    t *
                      (0.27886807 +
                        t *
                          (-1.13520398 +
                            t *
                              (1.48851587 +
                                t * (-0.82215223 + t * 0.17087277))))))))
  const result = t * Math.exp(polynomial)

  return value >= 0 ? result : 2 - result
}
