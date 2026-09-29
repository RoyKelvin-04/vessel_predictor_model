import { useMemo } from 'react';
import PredictorForm from '../components/PredictorForm';
import { trainModel, predict, evaluateModel } from '../model/predict';

function Predictor({ data }) {
  const model = useMemo(() => {
    if (data.length < 10) return null;
    return trainModel(data);
  }, [data]);

  const metrics = useMemo(() => {
    if (data.length < 10) return null;
    return evaluateModel(data);
  }, [data]);

  function handlePredict(input) {
    if (!model) return null;
    return predict(input, model);
  }

  if (!model) {
    return (
      <div className="bg-white border border-slate-200 p-12 text-center text-slate-400 text-sm">
        Not enough data to train the model. Please load at least 10 port-call records.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-navy-900 font-semibold text-lg">Predictor</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl leading-relaxed">
          The model is a multiple linear regression trained in your browser on the {data.length} port-call
          records currently loaded. It predicts wait time and service time separately, then sums them for
          total turnaround. Categorical inputs (vessel type, berth) are one-hot encoded.
        </p>
      </div>

      <PredictorForm onPredict={handlePredict} modelMetrics={metrics} />
    </div>
  );
}

export default Predictor;
