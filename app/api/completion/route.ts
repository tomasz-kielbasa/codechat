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

<instruction>
What was the highest price in 2016?
</instruction>
<file>
apple_stock.csv
</file>
<code>
import pandas as pd

# Load the CSV file
file_path = 'apple_stock.csv'
stock_data = pd.read_csv(file_path)

# Display the first few rows of the dataframe to understand its structure
print(stock_data.head())
</code>
<output>
Date       Open       High        Low      Close  Adj Close  \
0  2014-01-02  19.845715  19.893929  19.715000  19.754642  17.318729   
1  2014-01-03  19.745001  19.775000  19.301071  19.320715  16.938305   
2  2014-01-06  19.194643  19.528570  19.057142  19.426071  17.030676   
3  2014-01-07  19.440001  19.498571  19.211430  19.287144  16.908880   
4  2014-01-08  19.243214  19.484285  19.238930  19.409286  17.015959   

      Volume  
0  234684800  
1  392467600  
2  412610800  
3  317209200  
4  258529600
</output>
<code>
# Filter the data for 2016 and sort by price
stock_2016 = stock_data[stock_data['Date'].dt.year == 2016]

# Get the highest price in 2016
highest_price_2016 = stock_2016['High'].max()

print(highest_price_2016)
</code>
<output>
Error: Can only use .dt accessor with datetimelike values
</output>
<code>
# Convert Date column to datetime
apple_stock_data['Date'] = pd.to_datetime(apple_stock_data['Date'])

# Filter the data for 2016 and sort by price
stock_2016 = stock_data[stock_data['Date'].dt.year == 2016]

# Get the highest price in 2016
highest_price_2016 = stock_2016['High'].max()

print(highest_price_2016)
</code>
<output>
29.5625
</output>
<text>
The highest price of Apple stock in 2016 was approximately $29.56.
</text>

${prompt}`
  console.log(formattedPrompt)

  // Request the OpenAI API for the response based on the prompt
  const response = await openai.completions.create({
    model: 'mistralai/Mixtral-8x7B-v0.1',
    max_tokens: 256,
    stream: true,
    stop: ['<output>', '<instruction>'],
    temperature: 0.0,
    prompt: formattedPrompt,
  });
 
  const stream = OpenAIStream(response);
 
  return new StreamingTextResponse(stream);
}