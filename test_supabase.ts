import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://okspvlmjkapfoucjvdxr.supabase.co'
const supabaseAnonKey = 'sb_publishable_cSHiLMviNuxaaTCgOMq43g_SxPDNF76'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testQuery() {
    console.log('Fetching grammar data...')
    const { data, error } = await supabase
        .from('grammar')
        .select('*, grammar_examples(*)')
        .order('jlpt_level', { ascending: false });

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Data count:', data?.length)
        if (data && data.length > 0) {
            console.log('First item keys:', Object.keys(data[0]))
            console.log('grammar_examples count in first item:', data[0].grammar_examples?.length)
        }
    }
}

testQuery()
