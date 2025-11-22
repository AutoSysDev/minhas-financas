import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const ChartTest: React.FC = () => {
    const testData = [
        { name: 'Alimentação', value: 250, color: '#0088FE' },
        { name: 'Transporte', value: 5000, color: '#00C49F' },
        { name: 'Outros', value: 50, color: '#FFBB28' }
    ];

    console.log('ChartTest renderizando com dados:', testData);

    return (
        <div className="flex flex-col gap-8 animate-fade-in p-8">
            <div>
                <h1 className="text-[#0d141b] dark:text-white text-3xl font-black">Teste de Gráficos</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Verificando se os gráficos renderizam</p>
            </div>

            {/* Teste 1: Com ResponsiveContainer */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-[#0d141b] dark:text-white mb-4">Teste 1: ResponsiveContainer</h3>
                <div style={{ width: '100%', height: '300px', backgroundColor: '#f0f0f0' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={testData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {testData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#fff" />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Teste 2: Dimensões fixas */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-[#0d141b] dark:text-white mb-4">Teste 2: Dimensões Fixas (400x300)</h3>
                <div style={{ backgroundColor: '#f0f0f0', padding: '20px' }}>
                    <PieChart width={400} height={300}>
                        <Pie
                            data={testData}
                            cx={200}
                            cy={150}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {testData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#fff" />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </div>
            </div>

            {/* Dados */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold mb-2 text-[#0d141b] dark:text-white">Dados do gráfico:</h4>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-auto text-gray-900 dark:text-gray-100">
                    {JSON.stringify(testData, null, 2)}
                </pre>
                <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Se você vê esta mensagem mas não vê os gráficos acima, há um problema com a biblioteca recharts.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChartTest;
