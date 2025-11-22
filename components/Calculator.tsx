import React, { useState } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';

export const Calculator: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState<number | null>(null);
    const [operation, setOperation] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const inputDigit = (digit: string) => {
        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const inputDecimal = () => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
        }
    };

    const clear = () => {
        setDisplay('0');
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
    };

    const backspace = () => {
        if (!waitingForOperand) {
            const newDisplay = display.slice(0, -1);
            setDisplay(newDisplay || '0');
        }
    };

    const percentage = () => {
        const value = parseFloat(display);
        setDisplay(String(value / 100));
    };

    const toggleSign = () => {
        const value = parseFloat(display);
        setDisplay(String(-value));
    };

    const performOperation = (nextOperation: string) => {
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(inputValue);
        } else if (operation) {
            const currentValue = previousValue || 0;
            let newValue = currentValue;

            switch (operation) {
                case '+':
                    newValue = currentValue + inputValue;
                    break;
                case '-':
                    newValue = currentValue - inputValue;
                    break;
                case '*':
                    newValue = currentValue * inputValue;
                    break;
                case '/':
                    newValue = inputValue !== 0 ? currentValue / inputValue : 0;
                    break;
                case '=':
                    newValue = inputValue;
                    break;
            }

            setDisplay(String(newValue));
            setPreviousValue(newValue);
        }

        setWaitingForOperand(true);
        setOperation(nextOperation);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Calculadora">
            <div className="flex flex-col gap-4">
                {/* Display */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-white/10">
                    <div className="text-right text-4xl font-bold text-white font-mono break-all min-h-[3rem] flex items-center justify-end">
                        {display}
                    </div>
                    {previousValue !== null && operation && (
                        <div className="text-right text-sm text-gray-400 mt-2">
                            {previousValue} {operation}
                        </div>
                    )}
                </div>

                {/* Botões */}
                <div className="grid grid-cols-4 gap-2">
                    {/* Linha 1: Funções especiais */}
                    <button
                        onClick={clear}
                        className="p-4 rounded-xl font-bold text-base transition-all bg-red-600 text-white hover:bg-red-700 active:scale-95 border border-white/10"
                    >
                        C
                    </button>
                    <button
                        onClick={backspace}
                        className="p-4 rounded-xl font-bold text-base transition-all bg-orange-600 text-white hover:bg-orange-700 active:scale-95 border border-white/10"
                    >
                        <Icon name="backspace" className="text-xl" />
                    </button>
                    <button
                        onClick={percentage}
                        className="p-4 rounded-xl font-bold text-base transition-all bg-gray-700 text-white hover:bg-gray-600 active:scale-95 border border-white/10"
                    >
                        %
                    </button>
                    <button
                        onClick={() => performOperation('/')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-teal-600 text-white hover:bg-teal-700 active:scale-95 border border-white/10"
                    >
                        ÷
                    </button>

                    {/* Linha 2: 7, 8, 9, × */}
                    <button
                        onClick={() => inputDigit('7')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        7
                    </button>
                    <button
                        onClick={() => inputDigit('8')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        8
                    </button>
                    <button
                        onClick={() => inputDigit('9')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        9
                    </button>
                    <button
                        onClick={() => performOperation('*')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-teal-600 text-white hover:bg-teal-700 active:scale-95 border border-white/10"
                    >
                        ×
                    </button>

                    {/* Linha 3: 4, 5, 6, − */}
                    <button
                        onClick={() => inputDigit('4')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        4
                    </button>
                    <button
                        onClick={() => inputDigit('5')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        5
                    </button>
                    <button
                        onClick={() => inputDigit('6')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        6
                    </button>
                    <button
                        onClick={() => performOperation('-')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-teal-600 text-white hover:bg-teal-700 active:scale-95 border border-white/10"
                    >
                        −
                    </button>

                    {/* Linha 4: 1, 2, 3, + */}
                    <button
                        onClick={() => inputDigit('1')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        1
                    </button>
                    <button
                        onClick={() => inputDigit('2')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        2
                    </button>
                    <button
                        onClick={() => inputDigit('3')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        3
                    </button>
                    <button
                        onClick={() => performOperation('+')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-teal-600 text-white hover:bg-teal-700 active:scale-95 border border-white/10"
                    >
                        +
                    </button>

                    {/* Linha 5: ±, 0, ., = */}
                    <button
                        onClick={toggleSign}
                        className="p-4 rounded-xl font-bold text-base transition-all bg-gray-700 text-white hover:bg-gray-600 active:scale-95 border border-white/10"
                    >
                        ±
                    </button>
                    <button
                        onClick={() => inputDigit('0')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        0
                    </button>
                    <button
                        onClick={inputDecimal}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gray-800 text-white hover:bg-gray-700 active:scale-95 border border-white/10"
                    >
                        .
                    </button>
                    <button
                        onClick={() => performOperation('=')}
                        className="p-4 rounded-xl font-bold text-xl transition-all bg-gradient-to-br from-teal-500 to-blue-600 text-white hover:shadow-lg active:scale-95 border border-white/10"
                    >
                        =
                    </button>
                </div>
            </div>
        </Modal>
    );
};
