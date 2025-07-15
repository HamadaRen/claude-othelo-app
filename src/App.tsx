import React, { useState, useCallback } from 'react';
import './App.css';

type Player = 'black' | 'white';
type Cell = Player | null;
type Board = Cell[][];
type GameState = 'start' | 'playing';

const createInitialBoard = (size: number): Board => {
  const board: Board = Array(size).fill(null).map(() => Array(size).fill(null));
  
  const center = size / 2;
  board[center - 1][center - 1] = 'white';
  board[center - 1][center] = 'black';
  board[center][center - 1] = 'black';
  board[center][center] = 'white';
  
  return board;
};

const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

const isValidMove = (board: Board, row: number, col: number, player: Player, boardSize: number): boolean => {
  if (board[row][col] !== null) return false;
  
  const opponent = player === 'black' ? 'white' : 'black';
  
  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    let hasOpponent = false;
    
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      if (board[r][c] === opponent) {
        hasOpponent = true;
      } else if (board[r][c] === player && hasOpponent) {
        return true;
      } else {
        break;
      }
      r += dr;
      c += dc;
    }
  }
  
  return false;
};

const makeMove = (board: Board, row: number, col: number, player: Player, boardSize: number): Board => {
  if (!isValidMove(board, row, col, player, boardSize)) return board;
  
  const newBoard = board.map(row => [...row]);
  newBoard[row][col] = player;
  
  const opponent = player === 'black' ? 'white' : 'black';
  
  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    const toFlip: [number, number][] = [];
    
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      if (newBoard[r][c] === opponent) {
        toFlip.push([r, c]);
      } else if (newBoard[r][c] === player && toFlip.length > 0) {
        toFlip.forEach(([fr, fc]) => {
          newBoard[fr][fc] = player;
        });
        break;
      } else {
        break;
      }
      r += dr;
      c += dc;
    }
  }
  
  return newBoard;
};

const getValidMoves = (board: Board, player: Player, boardSize: number): [number, number][] => {
  const moves: [number, number][] = [];
  
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (isValidMove(board, row, col, player, boardSize)) {
        moves.push([row, col]);
      }
    }
  }
  
  return moves;
};

const countPieces = (board: Board, boardSize: number): { black: number; white: number } => {
  let black = 0;
  let white = 0;
  
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] === 'black') black++;
      else if (board[row][col] === 'white') white++;
    }
  }
  
  return { black, white };
};

const StartScreen: React.FC<{ onSelectSize: (size: number) => void }> = ({ onSelectSize }) => {
  return (
    <div className="start-screen">
      <h1>オセロ</h1>
      <div className="board-size-selection">
        <h2>ボードサイズを選択してください</h2>
        <div className="size-buttons">
          <button className="size-button" onClick={() => onSelectSize(6)}>
            6×6
          </button>
          <button className="size-button" onClick={() => onSelectSize(8)}>
            8×8
          </button>
        </div>
      </div>
    </div>
  );
};

const GameScreen: React.FC<{ 
  boardSize: number; 
  onBackToStart: () => void; 
}> = ({ boardSize, onBackToStart }) => {
  const [board, setBoard] = useState<Board>(() => createInitialBoard(boardSize));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player | 'tie' | null>(null);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameOver || !isValidMove(board, row, col, currentPlayer, boardSize)) return;
    
    const newBoard = makeMove(board, row, col, currentPlayer, boardSize);
    setBoard(newBoard);
    
    const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';
    const nextPlayerMoves = getValidMoves(newBoard, nextPlayer, boardSize);
    const currentPlayerMoves = getValidMoves(newBoard, currentPlayer, boardSize);
    
    if (nextPlayerMoves.length > 0) {
      setCurrentPlayer(nextPlayer);
    } else if (currentPlayerMoves.length > 0) {
      // 次のプレイヤーが打てない場合、現在のプレイヤーが続行
    } else {
      // 両方とも打てない場合、ゲーム終了
      setGameOver(true);
      const { black, white } = countPieces(newBoard, boardSize);
      if (black > white) setWinner('black');
      else if (white > black) setWinner('white');
      else setWinner('tie');
    }
  }, [board, currentPlayer, gameOver, boardSize]);

  const resetGame = () => {
    setBoard(createInitialBoard(boardSize));
    setCurrentPlayer('black');
    setGameOver(false);
    setWinner(null);
  };

  const { black, white } = countPieces(board, boardSize);
  const validMoves = getValidMoves(board, currentPlayer, boardSize);

  return (
    <div className="app">
      <button className="back-button" onClick={onBackToStart}>
        ← スタート画面に戻る
      </button>
      
      <h1>オセロ ({boardSize}×{boardSize})</h1>
      
      <div className="game-info">
        <div className="scores">
          <div className={`score ${currentPlayer === 'black' ? 'active' : ''}`}>
            <span className="piece black"></span>
            黒: {black}
          </div>
          <div className={`score ${currentPlayer === 'white' ? 'active' : ''}`}>
            <span className="piece white"></span>
            白: {white}
          </div>
        </div>
        
        {gameOver ? (
          <div className="game-status">
            ゲーム終了! {winner === 'tie' ? '引き分け' : `${winner === 'black' ? '黒' : '白'}の勝ち`}
          </div>
        ) : (
          <div className="game-status">
            {currentPlayer === 'black' ? '黒' : '白'}の番
          </div>
        )}
      </div>

      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`cell ${validMoves.some(([r, c]) => r === rowIndex && c === colIndex) ? 'valid-move' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell && <div className={`piece ${cell}`}></div>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button className="reset-button" onClick={resetGame}>
        リセット
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [boardSize, setBoardSize] = useState<number>(8);

  const handleSelectSize = (size: number) => {
    setBoardSize(size);
    setGameState('playing');
  };

  const handleBackToStart = () => {
    setGameState('start');
  };

  if (gameState === 'start') {
    return <StartScreen onSelectSize={handleSelectSize} />;
  }

  return (
    <GameScreen 
      boardSize={boardSize} 
      onBackToStart={handleBackToStart} 
    />
  );
};

export default App;
