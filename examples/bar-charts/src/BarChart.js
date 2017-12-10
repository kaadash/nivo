import React from 'react'
import { ResponsiveBar } from '@nivo/bar';
import { generateCountriesData } from 'nivo-generators'
import { keys } from 'lodash';

const colors = ['#fae04d', '#ff744c', '#789792', '#b1646a', '#efa9a1', '#8470c7', '#97a66f'];
const data = generateCountriesData(['rock', 'jazz', 'hip-hop', 'reggae', 'folk'], { size: 9 });
const dataKeys = keys(data[0]);
const keyNames = dataKeys.reduce((keyNameAcc, name) => {
  keyNameAcc[name] = {
    name,
    format: 1,
  };
  return keyNameAcc;
}, {});

const Bar = () => (
  <div style={{marginTop: '80px', marginLeft: '50px', height: '400px', minWidth: '600px'}}>
    <ResponsiveBar
      margin={{
        top: 1.5,
        right: 0,
        bottom: 2,
        left: 40,
      }}
      padding={0.2}
      data={data}
      indexBy="country"
      enableGridX={false}
      enableGridY={false}
      keys={['rock', 'jazz', 'hip-hop', 'reggae', 'folk']}
      keyNames={keyNames}
      colors={colors}
      enableTemplates={true}
      groupMode={'grouped'}
      enableLabel={false}
      tooltipFormat={(value) => value}
      isInteractive={true}
      animate={false}
    />
  </div>
)

export default Bar
