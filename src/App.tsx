import { useState, useEffect } from 'react'
import type { DragEvent } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

// Define the colors as constants to ensure consistency
const COLORS = {
  available: {
    background: '#e3f2fd',  // Light blue background
    border: '#2196F3',      // Blue border
    hover: '#bbdefb'        // Darker blue on hover
  },
  operation: {
    background: '#ff9800',  // Orange background
    hover: '#f57c00',       // Darker orange on hover
    active: '#ef6c00'       // Even darker orange when pressed
  }
} as const;

type GameLevel = 0 | 1 | 2 | 3 | 4

type Operation = '+' | '-' | '*' | ':';

const LEVEL_NAMES = {
  0: 'Beginner',
  1: 'Intermediate',
  2: 'Proficient',
  3: 'Expert',
  4: 'Master'
} as const;

// Base available numbers - will be filtered based on level
const ALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 50, 100]

type LevelParams = {
  poolSize: number;
  availableNumbers: number[];
  targetRange: { min: number; max: number };
  operations: string[];
  requireNonInteger?: boolean;
}

// Get level-specific parameters
const getLevelParams = (level: GameLevel): LevelParams => {
  switch (level) {
    case 0:
      return {
        poolSize: 3,
        availableNumbers: ALL_NUMBERS.filter(n => n <= 5),
        targetRange: { min: 1, max: 10 },
        operations: ['+', '-']
      }
    case 1:
      return {
        poolSize: 3,
        availableNumbers: ALL_NUMBERS.filter(n => n <= 5),
        targetRange: { min: 1, max: 10 },
        operations: ['+', '-', '×']
      }
    case 2:
      return {
        poolSize: 4,
        availableNumbers: ALL_NUMBERS.filter(n => n <= 10),
        targetRange: { min: 1, max: 20 },
        operations: ['+', '-', '×', '÷']
      }
    case 3:
      return {
        poolSize: 6,
        availableNumbers: ALL_NUMBERS,
        targetRange: { min: 1, max: 1000 },
        operations: ['+', '-', '×', '÷']
      }
    case 4:
      return {
        poolSize: 4,
        availableNumbers: ALL_NUMBERS.filter(n => n <= 10),
        targetRange: { min: 1, max: 50 },
        operations: ['+', '-', '×', '÷'],
        requireNonInteger: true
      }
  }
}

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  font-weight: normal;
`

const Button = styled.button<{ isPressed?: boolean }>`
  background-color: ${props => props.isPressed ? '#3a3f9e' : '#646cff'};
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.05s ease;
  position: relative;
  top: ${props => props.isPressed ? '2px' : '0'};
  box-shadow: ${props => props.isPressed 
    ? '0 1px 2px rgba(0, 0, 0, 0.2)' 
    : '0 4px 6px rgba(0, 0, 0, 0.1)'};

  &:active {
    background-color: #3a3f9e;
    top: 2px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  &:hover {
    background-color: ${props => props.isPressed ? '#3a3f9e' : '#535bf2'};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    top: 0;
    box-shadow: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;
    background-color: ${props => props.isPressed ? 'rgba(0, 0, 0, 0.1)' : 'transparent'};
    pointer-events: none;
  }
`

const GameContainer = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  border-radius: 12px;
  background-color: #f5f5f5;
`

const NumbersContainer = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 1.5rem 0;
`

const TargetNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #646cff;
  margin: 1rem 0;
`

const OperationsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
`

const OperationsRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`

const SuccessMessage = styled.div`
  color: #4CAF50;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1rem 0;
  animation: fadeIn 0.5s ease-in;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const CalculationLinesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
`

const CalculationLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
`

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

const DropTarget = styled.div<{ isUsed?: boolean; isAnimating?: boolean }>`
  width: 70px;
  height: 50px;
  border: 2px dashed ${props => props.isUsed ? '#ccc' : '#646cff'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background-color: ${props => props.isUsed ? '#f5f5f5' : 'white'};
  cursor: ${props => props.isUsed ? 'pointer' : 'pointer'};
  transition: all 0.2s;
  animation: ${props => props.isAnimating ? fadeOut : fadeIn} 0.3s ease-out;

  &:hover {
    background-color: ${props => props.isUsed ? '#f0f0ff' : '#f0f0ff'};
  }
`

const OperationDropTarget = styled(DropTarget)`
  width: 50px;
  color: ${COLORS.operation.background};
  border-color: ${COLORS.operation.background};

  &:hover {
    background-color: #fff3e0;
  }
`

const EqualsSign = styled.div`
  font-size: 1.2rem;
  color: #666;
  margin: 0 0.5rem;
`

// Update the operations display
const OPERATION_SYMBOLS: Record<Operation, string> = {
  '+': '+',
  '-': '-',
  '*': '×',
  ':': '÷'
} as const;

const DraggableNumber = styled.div<{ isUsed?: boolean; isAvailable?: boolean }>`
  background-color: ${props => {
    if (props.isUsed) return '#f5f5f5';
    if (props.isAvailable) return COLORS.available.background;
    return 'white';
  }};
  padding: 1rem;
  border-radius: 8px;
  min-width: 70px;
  font-size: 1.2rem;
  box-shadow: ${props => props.isAvailable ? `0 0 0 2px ${COLORS.available.border}` : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  cursor: ${props => props.isUsed ? 'not-allowed' : 'pointer'};
  user-select: none;
  transition: all 0.2s;
  opacity: ${props => props.isUsed ? 0.5 : 1};

  &:hover {
    transform: ${props => props.isUsed ? 'none' : 'scale(1.05)'};
    background-color: ${props => {
      if (props.isUsed) return '#f5f5f5';
      if (props.isAvailable) return COLORS.available.hover;
      return '#f0f0ff';
    }};
  }

  &:active {
    cursor: ${props => props.isUsed ? 'not-allowed' : 'grabbing'};
  }
`

const ResultDisplay = styled(DraggableNumber)<{ isLastLine?: boolean; isResultUsed?: boolean; isAnimating?: boolean }>`
  color: ${props => props.color || '#333'};
  border: ${props => {
    if (props.isLastLine) return '2px solid #646cff';
    return 'none';
  }};
  background-color: ${props => {
    if (props.isResultUsed) return '#f5f5f5';
    if (props.isAvailable) return COLORS.available.background;
    return 'white';
  }};
  cursor: ${props => props.isResultUsed ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.isResultUsed ? 0.5 : 1};
  min-width: 70px;
  text-align: center;
  animation: ${props => props.isAnimating ? fadeOut : fadeIn} 0.3s ease-out;

  &:hover {
    background-color: ${props => {
      if (props.isResultUsed) return '#f5f5f5';
      if (props.isAvailable) return COLORS.available.hover;
      return '#f0f0ff';
    }};
  }
`

const DraggableOperation = styled(DraggableNumber)`
  background-color: ${COLORS.operation.background};
  color: white;
  min-width: 50px;
  text-align: center;
  padding: 0.8rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: ${COLORS.operation.hover};
    transform: scale(1.05);
  }

  &:active {
    background-color: ${COLORS.operation.active};
  }
`

type NumberOrigin = 
  | { type: 'generated' }
  | { type: 'result', lineIndex: number }

interface NumberWithOrigin {
  value: number;
  origin: NumberOrigin;
}

interface CalculationLine {
  n1: NumberWithOrigin | null;
  op: string | null;
  n2: NumberWithOrigin | null;
  result: number | null;
  isComplete: boolean;
  isAnimating: boolean;
}

// Update the SolutionStep interface to handle result references
interface SolutionStep {
  n1: number | { value: number; lineIndex: number };
  op: Operation;
  n2: number | { value: number; lineIndex: number };
  result: number;
}

type DropPosition = 'n1' | 'n2' | 'op'

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`

// Add this styled component near the other styled components
const Fraction = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  font-size: 0.9em;
  vertical-align: middle;
  margin: 0 0.1em;
`

const FractionLine = styled.div`
  width: 100%;
  height: 1px;
  background-color: currentColor;
  margin: 0.1em 0;
`

const FractionTop = styled.div`
  padding-bottom: 0.1em;
`

const FractionBottom = styled.div`
  padding-top: 0.1em;
`

// Common fractions mapping
const COMMON_FRACTIONS: { [key: string]: string } = {
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞'
}

// Convert decimal to fraction
const decimalToFraction = (decimal: number): { numerator: number; denominator: number } => {
  const tolerance = 1.0E-6
  let h1 = 1, h2 = 0
  let k1 = 0, k2 = 1
  let b = decimal
  do {
    const a = Math.floor(b)
    let aux = h1
    h1 = a * h1 + h2
    h2 = aux
    aux = k1
    k1 = a * k1 + k2
    k2 = aux
    b = 1 / (b - a)
  } while (Math.abs(decimal - h1 / k1) > decimal * tolerance)

  // Simplify the fraction
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(Math.abs(h1), Math.abs(k1))
  return {
    numerator: h1 / divisor,
    denominator: k1 / divisor
  }
}

// Simplify formatNumber to only take the number value
const formatNumber = (value: number): string => {
  // If it's a whole number, return it as is
  if (Number.isInteger(value)) {
    return value.toString()
  }

  // Convert to fraction
  const { numerator, denominator } = decimalToFraction(value)

  // Format the fraction
  if (denominator === 1) return numerator.toString()
  
  // Check if it's a common fraction
  const fractionKey = `${numerator}/${denominator}`
  if (COMMON_FRACTIONS[fractionKey]) {
    return COMMON_FRACTIONS[fractionKey]
  }

  // For mixed numbers (whole number + fraction)
  if (numerator > denominator) {
    const whole = Math.floor(numerator / denominator)
    const remainder = numerator % denominator
    if (remainder === 0) return whole.toString()
    
    // Check if the fractional part is a common fraction
    const remainderFractionKey = `${remainder}/${denominator}`
    if (COMMON_FRACTIONS[remainderFractionKey]) {
      return `${whole} ${COMMON_FRACTIONS[remainderFractionKey]}`
    }
    
    // Use styled fraction for mixed numbers
    return (
      <span>
        {whole}{' '}
        <Fraction>
          <FractionTop>{remainder}</FractionTop>
          <FractionLine />
          <FractionBottom>{denominator}</FractionBottom>
        </Fraction>
      </span>
    ) as unknown as string
  }
  
  // Use styled fraction for simple fractions
  return (
    <Fraction>
      <FractionTop>{numerator}</FractionTop>
      <FractionLine />
      <FractionBottom>{denominator}</FractionBottom>
    </Fraction>
  ) as unknown as string
}

const LevelSelector = styled.div`
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`

const LevelButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
`

const InstructionText = styled.div`
  color: #666;
  font-size: 1rem;
  margin: 0.5rem 0 1.5rem 0;
  line-height: 1.4;
`

const LevelButton = styled.button<{ isSelected: boolean }>`
  background-color: ${props => props.isSelected ? '#3a3f9e' : '#646cff'};
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${props => props.isSelected ? 1 : 0.8};

  &:hover {
    background-color: ${props => props.isSelected ? '#3a3f9e' : '#535bf2'};
    opacity: 1;
  }
`

// Add these styled components near the other styled components
const float = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
`

const CelebrationContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
`

const CelebrationItem = styled.div<{ delay: number; left: number; size: number }>`
  position: absolute;
  bottom: -50px;
  left: ${props => props.left}%;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  animation: ${float} 3s ease-out ${props => props.delay}s forwards;
  font-size: ${props => props.size}px;
  opacity: 0;
`

const Balloon = styled(CelebrationItem)`
  color: ${() => ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead'][Math.floor(Math.random() * 5)]};
`

const Present = styled(CelebrationItem)`
  color: ${() => ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead'][Math.floor(Math.random() * 5)]};
`

// Add this styled component near the other styled components
const ScoreDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  font-size: 1.2rem;
  margin: 10px 0;
  color: #666;
`

const ScoreSection = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`

const ScoreLabel = styled.span`
  font-size: 0.9rem;
  color: #888;
`

const ScoreValue = styled.span<{ isHighScore: boolean }>`
  font-weight: bold;
  color: ${props => props.isHighScore ? '#4CAF50' : '#2196F3'};
`

const ScoreButton = styled.button<{ isPressed: boolean }>`
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: ${props => props.isPressed ? 'scale(0.95)' : 'scale(1)'};
  opacity: ${props => props.isPressed ? 0.9 : 1};
  margin: 0 10px;

  &:hover {
    background-color: #45a049;
  }

  &:active {
    transform: scale(0.95);
    opacity: 0.9;
  }
`

function App() {
  const [level, setLevel] = useState<GameLevel>(0)
  // Get level parameters based on current level
  const levelParams = getLevelParams(level)
  const POOL_SIZE = levelParams.poolSize
  const AVAILABLE_NUMBERS = levelParams.availableNumbers
  const OPERATIONS = levelParams.operations

  const [numbers, setNumbers] = useState<number[]>([])
  const [target, setTarget] = useState<number>(0)
  const [calculationLines, setCalculationLines] = useState<CalculationLine[]>(
    Array(POOL_SIZE - 1).fill({ n1: null, op: null, n2: null, result: null, isComplete: false, isAnimating: false })
  )
  const [showSuccess, setShowSuccess] = useState(false)
  const [isNewGamePressed, setIsNewGamePressed] = useState(false)
  const [isHintPressed, setIsHintPressed] = useState(false)
  const [isFindSolutionPressed, setIsFindSolutionPressed] = useState(false)
  const [isScorePressed, setIsScorePressed] = useState(false)
  const [storedSolution, setStoredSolution] = useState<SolutionStep[] | null>(null)
  const [hintLineIndex, setHintLineIndex] = useState<number>(-1)  // -1 means no hints shown yet
  const [score, setScore] = useState<number>(0)
  const [scoreLines, setScoreLines] = useState<CalculationLine[] | null>(null)
  const [bestScore, setBestScore] = useState<number>(0)
  const [bestResult, setBestResult] = useState<number | null>(null)
  const [bestDistance, setBestDistance] = useState<number>(Infinity)

  useEffect(() => {
    generateRandomNumbers()
  }, [level]) // Regenerate numbers when level changes

  const handleLevelChange = (newLevel: GameLevel) => {
    setLevel(newLevel)
    setShowSuccess(false)
    setStoredSolution(null)
    setHintLineIndex(-1)
    setScore(0)  // Reset score
    setScoreLines(null)  // Reset score lines
    setBestResult(null)  // Reset best result
    setBestDistance(Infinity)  // Reset best distance
    generateRandomNumbers()  // Generate new numbers for the new level
  }

  // Helper function to calculate result of an operation
  const calculateResult = (n1: number | { value: number; lineIndex: number }, op: string, n2: number | { value: number; lineIndex: number }): number | null => {
    try {
      const n1Value = typeof n1 === 'number' ? n1 : n1.value;
      const n2Value = typeof n2 === 'number' ? n2 : n2.value;
      let result: number;
      
      if (op === '+') {
        result = n1Value + n2Value;
      } else if (op === '-') {
        result = n1Value - n2Value;
      } else if (op === '×') {
        result = n1Value * n2Value;
      } else if (op === '÷') {
        if (n2Value === 0) return null;
        result = n1Value / n2Value;
      } else {
        return null;
      }

      return result > 0 ? result : null;
    } catch {
      return null;
    }
  }

  // Update the findAllSolutions function to ensure consistent Operation type usage
  const findAllSolutions = (
    numbersToCheck: number[], 
    targetToCheck: number,
    params: LevelParams,
    capSolutions?: number
  ): SolutionStep[][] => {
    const solutions: SolutionStep[][] = [];
    const maxSolutions = capSolutions ?? Infinity;

    const findSolutionsRecursive = (
      currentLine: number,
      usedIndices: Set<number>,
      availableResults: Map<number, number[]>,
      steps: SolutionStep[]
    ) => {
      if (solutions.length >= maxSolutions) {
        return;
      }

      if (currentLine === params.poolSize - 1) {
        if (Math.abs(steps[params.poolSize - 2].result - targetToCheck) < 0.0001) {
          solutions.push([...steps]);
          if (solutions.length >= maxSolutions) {
            return;
          }
        }
        return;
      }

      // Try each available number as n1
      for (let i = 0; i < numbersToCheck.length; i++) {
        if (usedIndices.has(i)) continue;
        const n1 = numbersToCheck[i];
        usedIndices.add(i);

        // Try using a result from previous lines as n1
        for (const [prevResult, lineIndices] of availableResults.entries()) {
          if (lineIndices.length > 0) {
            const newUsedIndices = new Set(usedIndices);
            newUsedIndices.delete(i);
            const newAvailableResults = new Map(availableResults);
            newAvailableResults.set(prevResult, lineIndices.slice(1));

            for (const op of params.operations as Operation[]) {
              if (solutions.length >= maxSolutions) {
                return;
              }

              for (let j = 0; j < numbersToCheck.length; j++) {
                if (newUsedIndices.has(j)) continue;
                const n2 = numbersToCheck[j];
                newUsedIndices.add(j);

                const calcResult = calculateResult({ value: prevResult, lineIndex: lineIndices[0] }, op, n2);
                if (calcResult !== null) {
                  const newSteps = [...steps, { 
                    n1: { value: prevResult, lineIndex: lineIndices[0] }, 
                    op: op as Operation, 
                    n2, 
                    result: calcResult 
                  }];
                  const newAvailableResults2 = new Map(newAvailableResults);
                  const resultLines = newAvailableResults2.get(calcResult) || [];
                  newAvailableResults2.set(calcResult, [...resultLines, currentLine]);

                  findSolutionsRecursive(currentLine + 1, newUsedIndices, newAvailableResults2, newSteps);
                  if (solutions.length >= maxSolutions) {
                    return;
                  }
                }
                newUsedIndices.delete(j);
              }
            }
          }
        }

        // Try using another number from the pool as n1
        for (let j = 0; j < numbersToCheck.length; j++) {
          if (usedIndices.has(j)) continue;
          const n2 = numbersToCheck[j];
          usedIndices.add(j);

          for (const op of params.operations as Operation[]) {
            if (solutions.length >= maxSolutions) {
              return;
            }

            const calcResult = calculateResult(n1, op, n2);
            if (calcResult !== null) {
              const newSteps = [...steps, { 
                n1, 
                op: op as Operation, 
                n2, 
                result: calcResult 
              }];
              const newAvailableResults = new Map(availableResults);
              const resultLines = newAvailableResults.get(calcResult) || [];
              newAvailableResults.set(calcResult, [...resultLines, currentLine]);

              findSolutionsRecursive(currentLine + 1, usedIndices, newAvailableResults, newSteps);
              if (solutions.length >= maxSolutions) {
                return;
              }
            }
          }
          usedIndices.delete(j);
        }
        usedIndices.delete(i);
      }
    }

    findSolutionsRecursive(0, new Set(), new Map(), []);
    return solutions;
  }

  // Helper function to check if a number is effectively an integer using epsilon
  const isEffectivelyInteger = (num: number): boolean => {
    const EPS = 0.0001;
    return Math.abs(Math.round(num) - num) < EPS;
  }

  // Find solutions based on level requirements
  const findSolutionsByLevel = (
    numbersToCheck: number[],
    targetToCheck: number,
    params: LevelParams,
    currentLevel: GameLevel
  ): SolutionStep[][] => {
    // For existence checks, we only need to find one solution
    const allSolutions = findAllSolutions(numbersToCheck, targetToCheck, params, 1);
    
    // If no solutions exist at all, return empty array
    if (allSolutions.length === 0) {
      return [];
    }

    // If we're just checking existence, we can return now
    if (currentLevel !== 2 && currentLevel !== 4) {
      return allSolutions;
    }

    // For levels 2 and 4, we need to check all solutions
    const allSolutionsFull = findAllSolutions(numbersToCheck, targetToCheck, params);

    if (currentLevel === 2) {
      // For level 2, we need to check ALL solutions to ensure at least one has all integer results
      const hasIntegerSolution = allSolutionsFull.some(solution => 
        solution.every(step => isEffectivelyInteger(step.result))
      );
      if (!hasIntegerSolution) {
        return [];
      }
      return allSolutionsFull;
    } else {  // level 4
      // For level 4, we need to check ALL solutions to ensure they ALL have at least one non-integer step
      const allHaveNonInteger = allSolutionsFull.every(solution => 
        solution.some(step => !isEffectivelyInteger(step.result))
      );
      if (!allHaveNonInteger) {
        return [];
      }
      return allSolutionsFull;
    }
  }

  const findSolutionExists = (
    numbersToCheck: number[], 
    targetToCheck: number,
    params: LevelParams
  ): boolean => {
    // Only need to find one solution to know if it exists
    const solutions = findSolutionsByLevel(numbersToCheck, targetToCheck, params, level);
    return solutions.length > 0;
  }

  const generateRandomNumbers = () => {
    let selectedNumbers: number[];
    let randomTarget: number;
    let hasSolution = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 1000;

    do {
      const shuffled = [...AVAILABLE_NUMBERS].sort(() => Math.random() - 0.5);
      selectedNumbers = shuffled.slice(0, POOL_SIZE);
      randomTarget = Math.floor(Math.random() * (levelParams.targetRange.max - levelParams.targetRange.min + 1)) + levelParams.targetRange.min;
      hasSolution = findSolutionExists(selectedNumbers, randomTarget, levelParams);
      attempts++;
    } while (!hasSolution && attempts < MAX_ATTEMPTS);

    if (!hasSolution) {
      // If we couldn't find a solution after max attempts, use a known good set for the level
      switch (level) {
        case 0:
          selectedNumbers = [1, 2, 3];
          randomTarget = 4;
          break;
        case 1:
          selectedNumbers = [1, 2, 3];
          randomTarget = 5;
          break;
        case 2:
          selectedNumbers = [2, 3, 4, 5];
          randomTarget = 15;
          break;
        case 3:
          selectedNumbers = [1, 2, 3, 4, 5, 6];
          randomTarget = 100;
          break;
        case 4:
          selectedNumbers = [2, 3, 4, 5];
          randomTarget = 25;
          break;
      }
    }
    
    setNumbers(selectedNumbers);
    setTarget(randomTarget);
    setCalculationLines(Array(POOL_SIZE - 1).fill({ n1: null, op: null, n2: null, result: null, isComplete: false, isAnimating: false }));
    setShowSuccess(false);
    setStoredSolution(null);
    setHintLineIndex(-1);
  }

  // Calculate used numbers from calculationLines
  const getUsedNumbers = () => {
    const used = new Array(numbers.length).fill(false)
    calculationLines.forEach((line, lineIndex) => {
      const n1 = line.n1
      const n2 = line.n2
      
      if (n1?.origin.type === 'generated') {
        const numIndex = numbers.findIndex(n => n === n1.value)
        if (numIndex !== -1) {
          used[numIndex] = true
        }
      }
      if (n2?.origin.type === 'generated') {
        const numIndex = numbers.findIndex(n => n === n2.value)
        if (numIndex !== -1) {
          used[numIndex] = true
        }
      }
    })
    return used
  }

  // Calculate if a result is used in any subsequent line
  const isResultUsed = (lineIndex: number) => {
    const result = calculationLines[lineIndex].result
    if (result === null) return false

    for (let i = lineIndex + 1; i < calculationLines.length; i++) {
      const line = calculationLines[i]
      const n1Origin = line.n1?.origin
      const n2Origin = line.n2?.origin
      
      if ((n1Origin?.type === 'result' && n1Origin.lineIndex === lineIndex) ||
          (n2Origin?.type === 'result' && n2Origin.lineIndex === lineIndex)) {
        return true
      }
    }
    return false
  }

  const handleDragStart = (e: DragEvent, value: number | string, type: 'number' | 'operation' | 'result', lineIndex?: number) => {
    if (type === 'number') {
      e.dataTransfer.setData('text/plain', `number|${value}|generated`)
    } else if (type === 'result' && lineIndex !== undefined) {
      e.dataTransfer.setData('text/plain', `result|${value}|${lineIndex}`)
    } else {
      e.dataTransfer.setData('text/plain', `${type}|${value}`)
    }
  }

  const handleDrop = (lineIndex: number, position: DropPosition, data: string) => {
    const [type, value, origin] = data.split('|')
    
    if (type === 'number' && (position === 'n1' || position === 'n2')) {
      const numValue = Number(value)
      const numIndex = numbers.indexOf(numValue)
      
      // Check if number is already used
      const usedNumbers = getUsedNumbers()
      if (usedNumbers[numIndex]) return
      
      // Update the calculation line
      const newLines = [...calculationLines]
      const updatedLine = {
        ...newLines[lineIndex],
        [position]: { value: numValue, origin: { type: 'generated' } }
      }
      newLines[lineIndex] = updatedLine
      
      setCalculationLines(newLines)

      // Calculate result if line is now complete
      if (updatedLine.n1 !== null && updatedLine.op !== null && updatedLine.n2 !== null) {
        calculateLineResult(lineIndex, newLines)
      }
    } else if (type === 'operation' && position === 'op') {
      // For operations, we need to ensure n1 is filled
      const line = calculationLines[lineIndex]
      if (line.n1 === null) return

      const newLines = [...calculationLines]
      const updatedLine = {
        ...newLines[lineIndex],
        op: value
      }
      newLines[lineIndex] = updatedLine
      
      setCalculationLines(newLines)

      // Calculate result if line is now complete
      if (updatedLine.n1 !== null && updatedLine.n2 !== null) {
        calculateLineResult(lineIndex, newLines)
      }
    } else if (type === 'result' && (position === 'n1' || position === 'n2')) {
      const resultValue = Number(value)
      const sourceLineIndex = Number(origin)
      
      // Only allow dropping results from lines above
      if (sourceLineIndex >= lineIndex) return
      
      // Check if this specific result instance is already used
      if (isResultUsed(sourceLineIndex)) return
      
      // Update the calculation line
      const newLines = [...calculationLines]
      const updatedLine = {
        ...newLines[lineIndex],
        [position]: { 
          value: resultValue, 
          origin: { type: 'result', lineIndex: sourceLineIndex }
        }
      }
      newLines[lineIndex] = updatedLine
      
      setCalculationLines(newLines)

      // Calculate result if line is now complete
      if (updatedLine.n1 !== null && updatedLine.op !== null && updatedLine.n2 !== null) {
        calculateLineResult(lineIndex, newLines)
      }
    }
  }

  const calculateLineResult = (lineIndex: number, lines: CalculationLine[]) => {
    const line = lines[lineIndex]
    if (line.n1 === null || line.op === null || line.n2 === null) return

    try {
      const n1 = line.n1.value
      const n2 = line.n2.value
      const op = line.op  // No need to convert, we're using the display symbols directly

      if (op === '÷' && n2 === 0) {
        return
      }

      const result = calculateResult(n1, op, n2)
      if (result === null || result <= 0) {
        return
      }
      
      const newLines = [...lines]
      newLines[lineIndex] = {
        ...line,
        result,
        isComplete: true,
        isAnimating: false
      }
      setCalculationLines(newLines)

      updateScore(newLines, lineIndex)

      if (lineIndex === POOL_SIZE - 2 && Math.abs(result - target) < 0.0001) {
        setShowSuccess(true)
      } else {
        setShowSuccess(false)
      }
    } catch (error) {
      console.error('Error calculating result:', error)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleCellClick = (lineIndex: number, position: DropPosition) => {
    const line = calculationLines[lineIndex]
    const value = line[position]
    
    if (value === null) return

    // Create a new array of lines to avoid state update conflicts
    const newLines = calculationLines.map((l, idx) => {
      if (idx === lineIndex) {
        return {
          ...l,
          [position]: null,  // Clear the value immediately
          isAnimating: true
        }
      }
      return l
    })

    // Update state once with all changes
    setCalculationLines(newLines)

    // After animation, cascade the clear
    setTimeout(() => {
      // Create a fresh copy of the lines for cascading
      const updatedLines = newLines.map((l, idx) => {
        if (idx === lineIndex) {
          return {
            ...l,
            result: null,
            isComplete: false,
            isAnimating: false
          }
        }
        return l
      })

      // Find and clear all dependent lines
      const clickedResult = line.result
      if (clickedResult !== null) {
        for (let i = lineIndex + 1; i < updatedLines.length; i++) {
          const dependentLine = updatedLines[i]
          const n1Origin = dependentLine.n1?.origin
          const n2Origin = dependentLine.n2?.origin
          
          if ((n1Origin?.type === 'result' && n1Origin.lineIndex === lineIndex) ||
              (n2Origin?.type === 'result' && n2Origin.lineIndex === lineIndex)) {
            updatedLines[i] = {
              n1: null,
              op: null,
              n2: null,
              result: null,
              isComplete: false,
              isAnimating: false
            }
          }
        }
      }

      setCalculationLines(updatedLines)
      setShowSuccess(false)
      // Update score after clearing lines
      updateScore(updatedLines, lineIndex)
    }, 300)
  }

  // Helper function to get origin for a solution step number
  const getOrigin = (num: number | { value: number; lineIndex: number }) => {
    if (typeof num === 'number') {
      return { type: 'generated' as const };
    }
    return { type: 'result' as const, lineIndex: num.lineIndex };
  };

  // Helper function to get value for a solution step number
  const getValue = (num: number | { value: number; lineIndex: number }) => {
    return typeof num === 'number' ? num : num.value;
  };

  // Update the findSolution function to ensure consistent Operation type usage
  const findSolution = (): SolutionStep[] | null => {
    const solutions = findAllSolutions(numbers, target, levelParams, 1);
    if (solutions.length === 0) {
      return null;
    }

    // Convert the solution to use result references where appropriate
    return solutions[0].map(step => ({
      n1: step.n1,
      op: step.op as Operation,
      n2: step.n2,
      result: step.result
    }));
  }

  // Update the findHint function to ensure consistent Operation type usage
  const findHint = (): SolutionStep | null => {
    const solutions = findAllSolutions(numbers, target, levelParams, 1);
    if (solutions.length === 0) {
      return null;
    }

    // Find the first incomplete line
    const currentLineIndex = calculationLines.findIndex(line => 
      line.n1 === null || line.op === null || line.n2 === null
    );

    if (currentLineIndex === -1) {
      return null;
    }

    // Get the hint step for the current line
    const hintStep = solutions[0][currentLineIndex];
    return {
      n1: hintStep.n1,
      op: hintStep.op as Operation,
      n2: hintStep.n2,
      result: hintStep.result
    };
  }

  // Add this component
  const Celebration = () => {
    const items = Array.from({ length: 20 }, () => ({
      type: Math.random() > 0.5 ? '🎈' : '🎁',
      delay: Math.random() * 2,
      left: Math.random() * 100,
      size: Math.random() * 20 + 20  // Random size between 20px and 40px
    }))

    return (
      <CelebrationContainer>
        {items.map((item, index) => (
          item.type === '🎈' ? (
            <Balloon key={index} delay={item.delay} left={item.left} size={item.size}>
              🎈
            </Balloon>
          ) : (
            <Present key={index} delay={item.delay} left={item.left} size={item.size}>
              🎁
            </Present>
          )
        ))}
      </CelebrationContainer>
    )
  }

  // Update the calculateScore function to track best result
  const calculateScore = (result: number, isLastLine: boolean): number => {
    const currentDistance = Math.abs(result - target)
    if (currentDistance < bestDistance) {
      setBestResult(result)
      setBestDistance(currentDistance)
    }
    
    if (isLastLine && Math.abs(result - target) < 0.0001) {
      return 10
    }
    
    if (currentDistance <= 5) {
      return Math.floor(Math.max(0, 5 - currentDistance))
    }
    
    return 0
  }

  const updateScore = (lines: CalculationLine[], currentLineIndex: number) => {
    // Don't update score if we're using a solution or hint
    if (level < 2 || storedSolution !== null) {
      return
    }

    const currentLine = lines[currentLineIndex]
    const isLastLine = currentLineIndex === POOL_SIZE - 2
    
    if (currentLine.result !== null) {
      const newScore = calculateScore(currentLine.result, isLastLine)
      setScore(prevScore => {
        if (newScore > prevScore) {
          setScoreLines([...lines])
          setBestScore(prevBest => Math.max(prevBest, newScore))
          return newScore
        }
        return prevScore
      })
    }
  }

  const handleRestoreScore = () => {
    if (score > 0 && scoreLines) {
      setCalculationLines([...scoreLines])
      setShowSuccess(score === 10)  // Show success message if it was a perfect score
    }
  }

  // Add a function to check if a result is available for use
  const isResultAvailable = (lineIndex: number): boolean => {
    // Last line's result should never be available
    if (lineIndex === POOL_SIZE - 2) return false;

    const result = calculationLines[lineIndex].result
    if (result === null) return false

    // Check if this result is used in any subsequent line
    for (let i = lineIndex + 1; i < calculationLines.length; i++) {
      const line = calculationLines[i]
      const n1Origin = line.n1?.origin
      const n2Origin = line.n2?.origin
      
      if ((n1Origin?.type === 'result' && n1Origin.lineIndex === lineIndex) ||
          (n2Origin?.type === 'result' && n2Origin.lineIndex === lineIndex)) {
        return false
      }
    }
    return true
  }

  const handleFindSolution = async () => {
    setIsFindSolutionPressed(true)
    await new Promise(resolve => setTimeout(resolve, 0))  // Ensure state update
    findSolution()
    // Keep pressed state for a bit longer to show the effect
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsFindSolutionPressed(false)
  }

  const findNextAvailablePosition = (type: 'number' | 'operation'): { lineIndex: number; position: DropPosition } | null => {
    for (let lineIndex = 0; lineIndex < calculationLines.length; lineIndex++) {
      const line = calculationLines[lineIndex]
      
      if (type === 'number') {
        // For numbers, try n1 first, then n2
        if (line.n1 === null) {
          return { lineIndex, position: 'n1' }
        }
        if (line.n2 === null && line.n1 !== null && line.op !== null) {
          return { lineIndex, position: 'n2' }
        }
      } else if (type === 'operation') {
        // For operations, only try op position if n1 is filled
        if (line.op === null && line.n1 !== null) {
          return { lineIndex, position: 'op' }
        }
      }
    }
    return null
  }

  const handleClick = (value: number | string, type: 'number' | 'operation' | 'result', lineIndex?: number) => {
    if (type === 'result' && lineIndex !== undefined) {
      // For results, use the same logic as drag
      const nextPos = findNextAvailablePosition('number')
      if (nextPos) {
        const resultValue = calculationLines[lineIndex].result
        if (resultValue !== null) {
          const data = `result|${resultValue}|${lineIndex}`
          handleDrop(nextPos.lineIndex, nextPos.position, data)
        }
      }
    } else {
      // For numbers and operations
      const nextPos = findNextAvailablePosition(type as 'number' | 'operation')
      if (nextPos) {
        const data = type === 'number' ? `number|${value}|generated` : `operation|${value}`
        handleDrop(nextPos.lineIndex, nextPos.position, data)
      }
    }
  }

  const handleNewGame = async () => {
    setIsNewGamePressed(true)
    await new Promise(resolve => setTimeout(resolve, 0))  // Ensure state update
    generateRandomNumbers()
    setStoredSolution(null)
    setHintLineIndex(-1)
    setScore(0)  // Reset score only when starting a new game
    setScoreLines(null)  // Reset score lines
    setBestResult(null)  // Reset best result
    setBestDistance(Infinity)  // Reset best distance
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsNewGamePressed(false)
  }

  return (
    <Container>
      <LevelSelector>
        <LevelButtons>
          {(Object.entries(LEVEL_NAMES) as [string, string][]).map(([levelNum, name]) => (
            <LevelButton
              key={levelNum}
              isSelected={level === Number(levelNum)}
              onClick={() => handleLevelChange(Number(levelNum) as GameLevel)}
            >
              {name}
            </LevelButton>
          ))}
        </LevelButtons>
      </LevelSelector>
      <Title>Reach the target using all {POOL_SIZE} numbers</Title>
      <InstructionText>
        You can use the result of any calculation in subsequent lines
      </InstructionText>
      <GameContainer>
        <TargetNumber>Target: {target}</TargetNumber>
        {(level >= 2) && (
          <ScoreDisplay>
            <ScoreSection>
              <ScoreLabel>Best:</ScoreLabel>
              <ScoreValue isHighScore={bestDistance < 0.0001}>
                {bestResult !== null ? formatNumber(bestResult) : '-'}
              </ScoreValue>
            </ScoreSection>
            {score > 0 && (
              <ScoreButton 
                onClick={handleRestoreScore}
                isPressed={isScorePressed}
                onMouseDown={() => setIsScorePressed(true)}
                onMouseUp={() => setIsScorePressed(false)}
                onMouseLeave={() => setIsScorePressed(false)}
              >
                Restore
              </ScoreButton>
            )}
            <ScoreSection>
              <ScoreLabel>Score:</ScoreLabel>
              <ScoreValue isHighScore={score >= 10}>
                {Math.floor(score)}
              </ScoreValue>
            </ScoreSection>
          </ScoreDisplay>
        )}
        <NumbersContainer>
          {numbers.map((num, index) => {
            const usedNumbers = getUsedNumbers()
            return (
              <DraggableNumber
                key={`${num}-${index}`}
                draggable={!usedNumbers[index]}
                isUsed={usedNumbers[index]}
                isAvailable={!usedNumbers[index]}  // Show as available if not used
                onDragStart={(e) => handleDragStart(e, num, 'number')}
                onClick={() => !usedNumbers[index] && handleClick(num, 'number')}
              >
                {num}
              </DraggableNumber>
            )
          })}
        </NumbersContainer>
        <OperationsContainer>
          <OperationsRow>
            {levelParams.operations.map((op) => (
              <DraggableOperation
                key={op}
                draggable
                onDragStart={(e) => handleDragStart(e, op, 'operation')}
                onClick={() => handleClick(op, 'operation')}
              >
                {op === '*' ? '×' : op === ':' ? '÷' : op}
              </DraggableOperation>
            ))}
          </OperationsRow>
        </OperationsContainer>
        <CalculationLinesContainer>
          {calculationLines.map((line, lineIndex) => (
            <CalculationLine key={lineIndex}>
              <DropTarget
                isUsed={line.n1 !== null}
                isAnimating={line.isAnimating}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(lineIndex, 'n1', e.dataTransfer.getData('text/plain'))}
                onClick={() => handleCellClick(lineIndex, 'n1')}
              >
                {line.n1?.value !== undefined ? formatNumber(line.n1.value) : null}
              </DropTarget>
              <OperationDropTarget
                isUsed={line.op !== null}
                isAnimating={line.isAnimating}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(lineIndex, 'op', e.dataTransfer.getData('text/plain'))}
                onClick={() => handleCellClick(lineIndex, 'op')}
              >
                {line.op}
              </OperationDropTarget>
              <DropTarget
                isUsed={line.n2 !== null}
                isAnimating={line.isAnimating}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(lineIndex, 'n2', e.dataTransfer.getData('text/plain'))}
                onClick={() => handleCellClick(lineIndex, 'n2')}
              >
                {line.n2?.value !== undefined ? formatNumber(line.n2.value) : null}
              </DropTarget>
              <EqualsSign>=</EqualsSign>
              <ResultDisplay
                isUsed={line.result !== null}
                isResultUsed={line.result !== null && isResultUsed(lineIndex)}
                isAnimating={line.isAnimating}
                isLastLine={lineIndex === POOL_SIZE - 2}
                isAvailable={line.result !== null && isResultAvailable(lineIndex)}  // Show as available if not used
                color={line.result === target ? '#4CAF50' : '#333'}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(lineIndex, 'n1', e.dataTransfer.getData('text/plain'))}
                onClick={() => {
                  if (line.result !== null && !isResultUsed(lineIndex)) {
                    const nextPos = findNextAvailablePosition('number')
                    if (nextPos) {
                      handleClick(line.result, 'result', lineIndex)
                    }
                  }
                }}
                draggable={line.result !== null && !isResultUsed(lineIndex)}
                onDragStart={(e) => line.result !== null && !isResultUsed(lineIndex) && handleDragStart(e, line.result, 'result', lineIndex)}
              >
                {line.result !== null ? formatNumber(line.result) : null}
              </ResultDisplay>
            </CalculationLine>
          ))}
        </CalculationLinesContainer>
        {showSuccess && (
          <>
            <SuccessMessage>Success! You reached the target number!</SuccessMessage>
            <Celebration />
          </>
        )}
        <ButtonContainer>
          <Button onClick={handleNewGame} isPressed={isNewGamePressed}>New</Button>
          <Button onClick={findHint} isPressed={isHintPressed}>Hint</Button>
          <Button onClick={handleFindSolution} isPressed={isFindSolutionPressed}>Solve</Button>
        </ButtonContainer>
      </GameContainer>
    </Container>
  )
}

export default App
