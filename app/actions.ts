'use server'

export type block = {
  content: string,
  tag: string,
  id: string,
}

function blockToString({tag, content}: block) {
  return `<${tag}>\n${content}\n</${tag}>`;
}

function blocksToString(blocks: Array<block>) {
  return blocks.filter((block) => block.tag != 'img').map(blockToString).join('\n')
}

function extractBlocks(inputString: string, tags: string[] = ['text', 'code']): Array<block> {
  let results: Array<block> = [];

  // Construct a regex pattern that matches any of the specified tags and handles unclosed last tag
  const pattern: RegExp = new RegExp(`<(${tags.join('|')})>([\\s\\S]*?)(<\/\\1>|$)`, 'g');

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(inputString)) !== null) {
      const tag: string = match[1];
      const content: string = match[2].trim();
      let block: { [key: string]: string } = {};
      block.tag = tag;
      block.content = content;
      block.id = crypto.randomUUID();
      results.push(block as block);
  }

  return results;
}

export async function generateNewBlocks(blocks: Array<block>) {
  const blocksString = blocksToString(blocks)
  console.log(blocksString)
  const prompt = `<conversation>
<file>
air_pollution.csv
</file>
<instruction>
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
<text>
I should only include rows where \`country\` is \`Poland\`, and then find \`city\` where \`2022\` is the largest.
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
</conversation>
<conversation>
<file>
cardioActivities.csv
</file>
<instruction>
What is the average climb when going for a ride?
</instruction>
<code>
import pandas as pd

# Load the CSV file
file_path = 'cardioActivities.csv'
cardio_data = pd.read_csv(file_path)

# Display the first few rows of the dataframe to understand its structure
print(cardio_data.head())
</code>
<output>
                  Date              Activity Id     Type Route Name  
0  2018-11-11 14:05:12  c9627fed-14ac-47a2-b...  Running        NaN   
1  2018-11-09 15:02:35  be65818d-a801-4847-a...  Running        NaN   
2  2018-11-04 16:05:00  c09b2f92-f855-497c-b...  Running        NaN   
3  2018-11-01 14:03:58  bc9b612d-3499-43ff-b...  Running        NaN   
4  2018-10-27 17:01:36  972567b2-1b0e-437c-9...  Running        NaN   

    Distance (km) Duration Average Pace  Average Speed (km/h)  
0          10.44    58:40         5:37                 10.68   
1          12.84  1:14:12         5:47                 10.39   
2          13.01  1:15:16         5:47                 10.37   
3          12.98  1:14:25         5:44                 10.47   
4          13.02  1:12:50         5:36                 10.73   

    Calories Burned  Climb (m)  Average Heart Rate (bpm)  Friend's Tagged  
0            774.0        130                    159.0               NaN   
1            954.0        168                    159.0               NaN   
2            967.0        171                    155.0               NaN   
3            960.0        169                    158.0               NaN   
4            967.0        170                    154.0               NaN   

  Notes               GPX File  
0   NaN  2018-11-11-140512.gpx  
1   NaN  2018-11-09-150235.gpx  
2   NaN  2018-11-04-160500.gpx  
3   NaN  2018-11-01-140358.gpx  
4   NaN  2018-10-27-170136.gpx  
</output>
<text>
I need to filter the dataset to include only the relevant activities (like cycling or riding). Let's see possible values of \`Type\`. After that I will take the average of \`Climb (m)\`.
</text>
<code>
print(cardio_data['Type'].unique())
</code>
<output>
['Running' 'Cycling' 'Other' 'Walking']
</output>
<text>
I will filter for activities, where \`Type\` is \`Cycling\`. Then I will take the average of \`Climb (m)\`.
</text>
<code>
# Filtering the dataset for cycling activities
cycling_data = cardio_data[cardio_data['Type'] == 'Cycling']

# Calculating the average climb for cycling activities
average_climb = cycling_data['Climb (m)'].mean()
print(average_climb)
</code>
<output>
240.55172413793105
</output>
<text>
The average climb for cycling activities in the dataset is approximately 240.55 meters.
</text>
<instruction>
Now, plot the the average speed depending on the activity.
</instruction>
<text>
I will group by \`Type\`, take the average of \`Average Speed (km/h)\` and create a plot.
</text>
<code>
import matplotlib.pyplot as plt
import seaborn as sns

# Grouping the data by activity type and calculating the average climb for each
average_climb_by_activity = cardio_data.groupby('Type')['Climb (m)'].mean()

# Plotting the average climb by activity type
sns.barplot(x=average_climb_by_activity.index, y=average_climb_by_activity.values)
plt.title('Average Climb by Activity Type')
plt.xlabel('Activity Type')
plt.ylabel('Average Climb (m)')
plt.xticks(rotation=45)
plt.show()
</code>
</conversation>
<conversation>
<file>
apple_stock.csv
</file>
<instruction>
Plot the price of apple in may 2022.
</instruction>
<code>
import pandas as pd

# Load the CSV file
file_path = 'apple_stock.csv'
stock_data = pd.read_csv(file_path)

# Display the first few rows of the dataframe to understand its structure
print(stock_data.head())
</code>
<output>
          Date       Open       High        Low      Close  Adj Close  
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
<text>
I will include data where \`Date\` is in May 2022 and plot the \`Close\` price for this period.
</text>
<code>
import matplotlib.pyplot as plt
import seaborn as sns

# Convert the 'Date' column to datetime and filter the data for May 2022
stock_data['Date'] = pd.to_datetime(stock_data['Date'])
filtered_data = stock_data[(stock_data['Date'].dt.year == 2022) & (stock_data['Date'].dt.month == 5)]

sns.lineplot(x='Date', y='Close', data=filtered_data)
plt.title('Stock Price of Apple in May 2022')
plt.xlabel('Date')
plt.ylabel('Price (USD)')
plt.xticks(rotation=45)
plt.show()
</code>
<instruction>
Which year had the highest return?
</instruction>
<text>
I will group by year, then take the first and last price every year. After that I'll calculate annual return. Finally I'll find the year with the highest return.
</text>
<code>
# Calculate the annual opening and closing prices
stock_data['Year'] = stock_data['Date'].dt.year
annual_data = stock_data.groupby('Year').agg({'Open':'first', 'Close':'last'})

# Calculate the annual return
annual_data['Annual Return'] = (annual_data['Close'] - annual_data['Open']) / annual_data['Open']

# Find the year with the highest return
year_with_highest_return = annual_data['Annual Return'].idxmax()
highest_return = annual_data['Annual Return'].max()

print(year_with_highest_return, highest_return)
</code>
<output>
2019 0.8958615472504773
</output>
<text>
The year with the highest returns for Apple stock was 2019, with an impressive annual return of approximately 89.59%.
</text>
</conversation>
<conversation>
${blocksString}`
  console.log(prompt)
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: 'Bearer e7dd4317f6d2619c9064d08beb3f0f49167106baefe18d128662fd77cc7197e7'
    },
    body: JSON.stringify({
      model: 'mistralai/Mixtral-8x7B-v0.1',
      prompt: prompt,
      max_tokens: 512,
      stop: ['<output>', '</conversation>', '<instruction>'],
      temperature: 0.0,
    })
  }
  const response = await fetch('https://api.together.xyz/v1/completions', options)
    .then(response => response.json())
    .then(response => response.choices[0].text)
    .then(response => extractBlocks(response))
  return response
}