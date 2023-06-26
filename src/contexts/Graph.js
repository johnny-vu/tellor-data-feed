import React, { useState, createContext, useEffect } from 'react'
//The Graph
import { ApolloClient, InMemoryCache, useQuery } from '@apollo/client'
//Utils
import { reporterQuery } from '../utils/queries'
import { decodingMiddleware, sortDataByProperty } from '../utils/helpers'

export const GraphContext = createContext()

//ApolloClients
const clientPlsmain = new ApolloClient({
  uri: 'https://graph.pulse.domains/subgraphs/name/graphprotocol/tellor-flex',
  cache: new InMemoryCache(),
})
const clientPlstest = new ApolloClient({
  uri: 'https://v4b.graph.pulse.domains/subgraphs/name/graphprotocol/tellor-flex',
  cache: new InMemoryCache(),
})

const Graph = ({ children }) => {
  //Component State
  const [graphPlsmainData, setGraphPlsmainData] = useState({})
  const [graphPlstestData, setGraphPlstestData] = useState({})
  const [allGraphData, setAllGraphData] = useState(null)
  const [decodedData, setDecodedData] = useState(null)

  //Graph Querying every 5 seconds
  //pulsechain(mainnet)
  const plsmain = useQuery(reporterQuery, {
    client: clientPlsmain,
    fetchPolicy: 'network-only',
    pollInterval: 5000,
  })
  //pulsechain(testnet)
  const plstest = useQuery(reporterQuery, {
    client: clientPlstest,
    fetchPolicy: 'network-only',
    pollInterval: 5000,
  })

  //useEffects for listening to reponses
  //from ApolloClient queries
  //PulseChain(mainnet)
  useEffect(() => {
    if (!plsmain) return
    setGraphPlsmainData({
      data: plsmain.data,
      loading: plsmain.loading,
      error: plsmain.error,
    })

    return () => {
      setGraphPlsmainData({})
    }
  }, [plsmain.data, plsmain.loading, plsmain.error]) //eslint-disable-line
  //PulseChain(testnet)
  useEffect(() => {
    if (!plstest) return
    setGraphPlstestData({
      data: plstest.data,
      loading: plstest.loading,
      error: plstest.error,
    })

    return () => {
      setGraphPlstestData({})
    }
  }, [plstest.data, plstest.loading, plstest.error]) //eslint-disable-line

  //For conglomerating data
  useEffect(() => {
    if (!graphPlsmainData.data || !graphPlstestData.data) return

    let eventsArray = []
    graphPlsmainData.data.newReportEntities.forEach((event) => {
      event.chain = 'PulseChain (Mainnet)'
      event.txnLink = `https://scan.pulsechain.com/tx/${event.txnHash}`
      eventsArray.push(event)
    })
    graphPlstestData.data.newReportEntities.forEach((event) => {
      event.chain = 'PulseChain (Testnet)'
      event.txnLink = `https://scan.v4.testnet.pulsechain.com/tx/${event.txnHash}`
      eventsArray.push(event)
    })
    let sorted = sortDataByProperty('_time', eventsArray)
    setAllGraphData(sorted)

    return () => {
      setAllGraphData(null)
    }
  }, [graphPlsmainData, graphPlstestData])

  useEffect(() => {
    if (!allGraphData) return
    setDecodedData(decodingMiddleware(allGraphData))

    return () => {
      setDecodedData(null)
    }
  }, [allGraphData])

  const GraphContextObj = {
    decodedData: decodedData,
  }

  // console.log(graphArboneData)

  return (
    <GraphContext.Provider value={GraphContextObj}>
      {children}
    </GraphContext.Provider>
  )
}

export default Graph
