import { useState, useEffect } from 'react'
import type { DragEvent } from 'react'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'

const AVAILABLE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 50, 100]
const OPERATIONS = ['+', '-', '*', ':']

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
`

const Button = styled.button`
  background-color: #646cff;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #535bf2;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
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
  color: #4CAF50;
`

const EqualsSign = styled.div`
  font-size: 1.2rem;
  color: #666;
  margin: 0 0.5rem;
`

const ResultDisplay = styled(DropTarget)<{ isUsed?: boolean; isResultUsed?: boolean; isLastLine?: boolean }>`
  color: ${props => props.color || '#333'};
  border: ${props => props.isLastLine ? '2px solid #646cff' : 'none'};  // Target number color
  background-color: ${props => {
    if (props.isResultUsed) return '#f5f5f5';
    if (props.isUsed) return 'white';
    return '#f0f0f0';
  }};
  cursor: ${props => props.isResultUsed ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.isResultUsed ? 0.5 : 1};
  min-width: 70px;
  text-align: center;

  &:hover {
    background-color: ${props => {
      if (props.isResultUsed) return '#f5f5f5';
      if (props.isUsed) return '#f0f0ff';
      return '#e8e8e8';
    }};
  }
`

const DraggableNumber = styled.div<{ isUsed?: boolean }>`
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  min-width: 70px;
  font-size: 1.2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: ${props => props.isUsed ? 'not-allowed' : 'pointer'};
  user-select: none;
  transition: all 0.2s;
  opacity: ${props => props.isUsed ? 0.5 : 1};
  background-color: ${props => props.isUsed ? '#f5f5f5' : 'white'};

  &:hover {
    transform: ${props => props.isUsed ? 'none' : 'scale(1.05)'};
    background-color: ${props => props.isUsed ? '#f5f5f5' : '#f0f0ff'};
  }

  &:active {
    cursor: ${props => props.isUsed ? 'not-allowed' : 'grabbing'};
  }
`

const DraggableOperation = styled(DraggableNumber)`
  background-color: #4CAF50;
  color: white;
  min-width: 50px;
  text-align: center;
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

interface SolutionStep {
  n1: number;
  op: string;
  n2: number;
  result: number;
}

type Position = 'n1' | 'n2' | 'op' | 'result'
type DropPosition = 'n1' | 'n2' | 'op'

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
`

// Simplify formatNumber to only take the number value
const formatNumber = (value: number): string => {
  // If it's a whole number, return it as is
  if (Number.isInteger(value)) {
    return value.toString()
  }

  // If it has 2 or fewer decimal places, return the decimal
  const decimalStr = value.toString()
  const decimalPlaces = decimalStr.includes('.') ? decimalStr.split('.')[1].length : 0
  if (decimalPlaces <= 2) {
    return decimalStr
  }

  // For numbers with more than 2 decimal places, convert to fraction
  const tolerance = 1.0E-6
  let h1 = 1, h2 = 0
  let k1 = 0, k2 = 1
  let b = value
  do {
    const a = Math.floor(b)
    let aux = h1
    h1 = a * h1 + h2
    h2 = aux
    aux = k1
    k1 = a * k1 + k2
    k2 = aux
    b = 1 / (b - a)
  } while (Math.abs(value - h1 / k1) > value * tolerance)

  // Simplify the fraction
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(Math.abs(h1), Math.abs(k1))
  h1 = h1 / divisor
  k1 = k1 / divisor

  // Format the fraction
  if (k1 === 1) return h1.toString()
  if (h1 > k1) {
    const whole = Math.floor(h1 / k1)
    const remainder = h1 % k1
    return remainder === 0 ? whole.toString() : `${whole} ${remainder}/${k1}`
  }
  return `${h1}/${k1}`
}

function App() {
  const [numbers, setNumbers] = useState<number[]>([])
  const [target, setTarget] = useState<number>(0)
  const [calculationLines, setCalculationLines] = useState<CalculationLine[]>(
    Array(5).fill({ n1: null, op: null, n2: null, result: null, isComplete: false, isAnimating: false })
  )
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    generateRandomNumbers()
  }, [])

  const generateRandomNumbers = () => {
    const shuffled = [...AVAILABLE_NUMBERS].sort(() => Math.random() - 0.5)
    const selectedNumbers = shuffled.slice(0, 6)
    const randomTarget = Math.floor(Math.random() * (1000 - 50) + 50)
    
    setNumbers(selectedNumbers)
    setTarget(randomTarget)
    setCalculationLines(Array(5).fill({ n1: null, op: null, n2: null, result: null, isComplete: false, isAnimating: false }))
    setShowSuccess(false)
  }

  // Calculate used numbers from calculationLines
  const getUsedNumbers = () => {
    const used = new Array(numbers.length).fill(false)
    calculationLines.forEach(line => {
      if (line.n1?.origin.type === 'generated') {
        const index = numbers.indexOf(line.n1.value)
        if (index !== -1) used[index] = true
      }
      if (line.n2?.origin.type === 'generated') {
        const index = numbers.indexOf(line.n2.value)
        if (index !== -1) used[index] = true
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
      // Convert division operator and ensure we have valid numbers
      const n1 = line.n1.value
      const n2 = line.n2.value
      const op = line.op === ':' ? '/' : line.op

      // Only prevent division by zero
      if (op === '/' && n2 === 0) {
        return
      }

      const exprString = `${n1} ${op} ${n2}`
      const result = new Function(`return ${exprString}`)()
      
      // Allow any positive number (including decimals)
      if (result <= 0) {
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

      // Check if this is the last line and if it matches the target
      if (lineIndex === 4 && result === target) {
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
    }, 300)
  }

  const findSolution = () => {
    // Helper function to calculate result of an operation
    const calculateResult = (n1: number, op: string, n2: number): number | null => {
      try {
        const exprString = `${n1} ${op === ':' ? '/' : op} ${n2}`
        const result = new Function(`return ${exprString}`)()
        // Only allow integer results
        if (Number.isInteger(result) && result > 0) {
          return result
        }
        return null
      } catch {
        return null
      }
    }

    // Recursive function to find a solution
    const findSolutionRecursive = (
      currentLine: number,
      usedIndices: Set<number>,
      availableResults: Map<number, number[]>, // Map of result value to line indices
      steps: SolutionStep[]
    ): SolutionStep[] | null => {
      if (currentLine === 5) {
        // Check if the last result matches the target
        return steps[4].result === target ? steps : null
      }

      // Try all possible combinations of numbers and operations
      for (let i = 0; i < numbers.length; i++) {
        if (usedIndices.has(i)) continue
        const n1 = numbers[i]
        usedIndices.add(i)

        // Try using a result from previous lines as n1
        for (const [prevResult, lineIndices] of availableResults.entries()) {
          if (lineIndices.length > 0) {
            const newUsedIndices = new Set(usedIndices)
            newUsedIndices.delete(i) // Remove the number we just added
            const newAvailableResults = new Map(availableResults)
            newAvailableResults.set(prevResult, lineIndices.slice(1)) // Remove one instance of this result

            for (const op of OPERATIONS) {
              // Try all numbers for n2
              for (let j = 0; j < numbers.length; j++) {
                if (newUsedIndices.has(j)) continue
                const n2 = numbers[j]
                newUsedIndices.add(j)

                const calcResult = calculateResult(prevResult, op, n2)
                if (calcResult !== null) {
                  const newSteps = [...steps, { n1: prevResult, op, n2, result: calcResult }]
                  const newAvailableResults2 = new Map(newAvailableResults)
                  const resultLines = newAvailableResults2.get(calcResult) || []
                  newAvailableResults2.set(calcResult, [...resultLines, currentLine])

                  const solution = findSolutionRecursive(currentLine + 1, newUsedIndices, newAvailableResults2, newSteps)
                  if (solution) return solution
                }
                newUsedIndices.delete(j)
              }
            }
          }
        }

        // Try using another number from the pool as n1
        for (let j = 0; j < numbers.length; j++) {
          if (usedIndices.has(j)) continue
          const n2 = numbers[j]
          usedIndices.add(j)

          for (const op of OPERATIONS) {
            const calcResult = calculateResult(n1, op, n2)
            if (calcResult !== null) {
              const newSteps = [...steps, { n1, op, n2, result: calcResult }]
              const newAvailableResults = new Map(availableResults)
              const resultLines = newAvailableResults.get(calcResult) || []
              newAvailableResults.set(calcResult, [...resultLines, currentLine])

              const solution = findSolutionRecursive(currentLine + 1, usedIndices, newAvailableResults, newSteps)
              if (solution) return solution
            }
          }
          usedIndices.delete(j)
        }
        usedIndices.delete(i)
      }
      return null
    }

    // Start the search
    const solution = findSolutionRecursive(0, new Set(), new Map(), [])
    if (solution) {
      // Apply the solution to the game
      const newLines: CalculationLine[] = solution.map(step => ({
        n1: { value: step.n1, origin: { type: 'generated' as const } },
        op: step.op,
        n2: { value: step.n2, origin: { type: 'generated' as const } },
        result: step.result,
        isComplete: true,
        isAnimating: false
      }))
      setCalculationLines(newLines)
      setShowSuccess(true)
    } else {
      alert('No solution found! Try different numbers.')
    }
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

  return (
    <Container>
      <Title>Reach the target using all 6 numbers</Title>
      <GameContainer>
        <TargetNumber>Target: {target}</TargetNumber>
        <NumbersContainer>
          {numbers.map((num, index) => {
            const usedNumbers = getUsedNumbers()
            return (
              <DraggableNumber
                key={`${num}-${index}`}
                draggable={!usedNumbers[index]}
                isUsed={usedNumbers[index]}
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
            {OPERATIONS.map((op) => (
              <DraggableOperation
                key={op}
                draggable
                onDragStart={(e) => handleDragStart(e, op, 'operation')}
                onClick={() => handleClick(op, 'operation')}
              >
                {op}
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
                isLastLine={lineIndex === 4}
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
        {showSuccess && <SuccessMessage>Success! You reached the target number!</SuccessMessage>}
        <ButtonContainer>
          <Button onClick={generateRandomNumbers}>New Game</Button>
          <Button onClick={findSolution}>Find Solution</Button>
        </ButtonContainer>
      </GameContainer>
    </Container>
  )
}

export default App
