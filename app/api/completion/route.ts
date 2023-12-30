import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse, experimental_StreamData } from 'ai';
 
export const runtime = 'edge';
 
const openai = new OpenAI({
  apiKey: process.env.TOGETHER_AI_API_KEY!,
  baseURL: 'https://api.together.xyz/v1'
});
 
export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { prompt } = await req.json();
  const formattedPrompt = `<instruction>
Which city in Poland had the highest pollution in 2022?
</instruction>
<file>
air_pollution.csv
</file>
<code>
import pandas as pd

# Load the CSV file
file_path = 'air_pollution.csv'
pollution_data = pd.read_csv(file_path)

# Display the first few rows of the dataframe to understand its structure
print(pollution_data.head())
</code>
<output>
      city      country  2017  2018  2019  2020  2021  2022  2023
0    Kabul  Afghanistan   NaN  61.8  58.8  46.5  37.5  17.1  18.1
1   Tirana      Albania   NaN   NaN   NaN  16.0  12.5  14.5  14.4
2  Algiers      Algeria   NaN   NaN  21.2  20.2  20.0  17.8  17.4
3   Ordino      Andorra   NaN   NaN   NaN   7.4   7.3   5.4   5.3
4   Luanda       Angola   NaN   NaN  15.9  13.0  11.0   8.8   8.7
</output>
<text>
I should only include columns where \`country\` is Poland, then extract the name of a city where value in \`2022\` column is the highest.
</text>
<code>
# Filter the data for cities in Poland and sort by pollution levels in 2022
poland_pollution = pollution_data[pollution_data['country'] == 'Poland']
highest_pollution_2022 = poland_pollution.sort_values(by='2022', ascending=False)

# Get the city with the highest pollution in 2022
highest_pollution_city_2022 = highest_pollution_2022.iloc[0]

print(highest_pollution_city_2022['city'], highest_pollution_city_2022['2022'])
</code>
<output>
('Orzesze', 32.1)
</output>
<text>
In 2022, the city in Poland with the highest level of pollution was Orzesze, with a pollution index of 32.1.
</text>

${prompt}`
  console.log(formattedPrompt)

  // Request the OpenAI API for the response based on the prompt
  const response = await openai.completions.create({
    model: 'mistralai/Mixtral-8x7B-v0.1',
    max_tokens: 512,
    stream: true,
    stop: ['<output>', '<instruction>'],
    temperature: 0.0,
    prompt: formattedPrompt,
  });
 
  const stream = OpenAIStream(response);
 
  return new StreamingTextResponse(stream);
}